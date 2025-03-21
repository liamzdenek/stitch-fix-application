package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/aws/aws-sdk-go-v2/service/ses"
	sestypes "github.com/aws/aws-sdk-go-v2/service/ses/types"
	"github.com/sashabaranov/go-openai"
)

// User represents a customer in the system
type User struct {
	UserID              string   `json:"userId"`
	Email               string   `json:"email"`
	Name                string   `json:"name"`
	LastOrderDate       string   `json:"lastOrderDate"`
	OrderCount          int      `json:"orderCount"`
	AverageOrderValue   float64  `json:"averageOrderValue"`
	PreferredCategories []string `json:"preferredCategories"`
	EngagementScore     *float64 `json:"engagementScore,omitempty"`
	LastEmailDate       *string  `json:"lastEmailDate,omitempty"`
	CreatedAt           string   `json:"createdAt"`
	UpdatedAt           string   `json:"updatedAt"`
}

// Email represents a generated email
type Email struct {
	EmailID               string  `json:"emailId"`
	UserID                string  `json:"userId"`
	Subject               string  `json:"subject"`
	Content               string  `json:"content"`
	GeneratedAt           string  `json:"generatedAt"`
	EngagementScoreAtTime float64 `json:"engagementScoreAtTime"`
	Status                string  `json:"status"`
	CreatedAt             string  `json:"createdAt"`
}

// Event represents an event from the SNS topic
type Event struct {
	Type      string          `json:"type"`
	Payload   json.RawMessage `json:"payload"`
	Timestamp string          `json:"timestamp"`
}

// Configuration constants
const (
	// Engagement score threshold for sending emails
	EngagementScoreThreshold = 50.0

	// Minimum days between emails
	MinDaysBetweenEmails = 7

	// DynamoDB table names
	UsersTableName  = "Users"
	EmailsTableName = "Emails"

	// Email status values
	EmailStatusGenerated = "GENERATED"
	EmailStatusSent      = "SENT"
	EmailStatusFailed    = "FAILED"

	// Event types
	EventTypeUserCreated  = "USER_CREATED"
	EventTypeUserUpdated  = "USER_UPDATED"
	EventTypeOrderCreated = "ORDER_CREATED"
	EventTypeOrderUpdated = "ORDER_UPDATED"
)

// Global clients
var (
	dynamoClient *dynamodb.Client
	sesClient    *ses.Client
	openaiClient *openai.Client
)

func init() {
	// Initialize AWS SDK clients
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Fatalf("Failed to load AWS SDK config: %v", err)
	}

	dynamoClient = dynamodb.NewFromConfig(cfg)
	sesClient = ses.NewFromConfig(cfg)

	// Initialize OpenAI client
	openaiApiKey := os.Getenv("OPENAI_API_KEY")
	if openaiApiKey == "" {
		log.Println("Warning: OPENAI_API_KEY not set")
	}
	openaiClient = openai.NewClient(openaiApiKey)
}

// Lambda handler function
func handler(ctx context.Context, sqsEvent events.SQSEvent) error {
	for _, message := range sqsEvent.Records {
		log.Printf("Processing message: %s", message.MessageId)

		// Parse the SNS message from the SQS event
		var snsMessage map[string]interface{}
		if err := json.Unmarshal([]byte(message.Body), &snsMessage); err != nil {
			log.Printf("Error parsing SNS message: %v", err)
			continue
		}

		// Extract the actual message from the SNS envelope
		messageStr, ok := snsMessage["Message"].(string)
		if !ok {
			log.Printf("Error: SNS message does not contain a Message field")
			continue
		}

		// Parse the event
		var event Event
		if err := json.Unmarshal([]byte(messageStr), &event); err != nil {
			log.Printf("Error parsing event: %v", err)
			continue
		}

		// Process the event based on its type
		switch event.Type {
		case EventTypeUserCreated, EventTypeUserUpdated:
			var user User
			if err := json.Unmarshal(event.Payload, &user); err != nil {
				log.Printf("Error parsing user payload: %v", err)
				continue
			}
			if err := processUser(ctx, user); err != nil {
				log.Printf("Error processing user: %v", err)
			}
		case EventTypeOrderCreated, EventTypeOrderUpdated:
			// Get the user ID from the order
			var orderData map[string]interface{}
			if err := json.Unmarshal(event.Payload, &orderData); err != nil {
				log.Printf("Error parsing order payload: %v", err)
				continue
			}

			userID, ok := orderData["userId"].(string)
			if !ok {
				log.Printf("Error: Order does not contain a userId field")
				continue
			}

			// Get the user from DynamoDB
			user, err := getUserFromDynamoDB(ctx, userID)
			if err != nil {
				log.Printf("Error getting user from DynamoDB: %v", err)
				continue
			}

			// Process the user
			if err := processUser(ctx, user); err != nil {
				log.Printf("Error processing user: %v", err)
			}
		default:
			log.Printf("Ignoring event of type: %s", event.Type)
		}
	}

	return nil
}

// Process a user and generate an email if needed
func processUser(ctx context.Context, user User) error {
	log.Printf("Processing user: %s", user.UserID)

	// Calculate the engagement score
	engagementScore := calculateEngagementScore(user)
	log.Printf("Engagement score: %.2f", engagementScore)

	// Update the user's engagement score in DynamoDB
	if err := updateUserEngagementScore(ctx, user.UserID, engagementScore); err != nil {
		return fmt.Errorf("error updating user engagement score: %w", err)
	}

	// Check if we should generate an email
	if shouldGenerateEmail(user, engagementScore) {
		log.Printf("Generating email for user: %s", user.UserID)

		// Generate the email
		email, err := generateEmail(ctx, user, engagementScore)
		if err != nil {
			return fmt.Errorf("error generating email: %w", err)
		}

		// Save the email to DynamoDB
		if err := saveEmailToDynamoDB(ctx, email); err != nil {
			return fmt.Errorf("error saving email to DynamoDB: %w", err)
		}

		// Send the email
		if err := sendEmail(ctx, email, user); err != nil {
			return fmt.Errorf("error sending email: %w", err)
		}

		// Update the user's last email date in DynamoDB
		if err := updateUserLastEmailDate(ctx, user.UserID); err != nil {
			return fmt.Errorf("error updating user last email date: %w", err)
		}
	}

	return nil
}

// Calculate the engagement score for a user
func calculateEngagementScore(user User) float64 {
	// Calculate days since last order
	lastOrderDate, _ := time.Parse(time.RFC3339, user.LastOrderDate)
	daysSinceLastOrder := int(time.Since(lastOrderDate).Hours() / 24)

	// Calculate order count factor (max 1.0)
	orderCountFactor := float64(user.OrderCount) / 10
	if orderCountFactor > 1.0 {
		orderCountFactor = 1.0
	}

	// Calculate average order value factor (max 1.0)
	aovFactor := user.AverageOrderValue / 200
	if aovFactor > 1.0 {
		aovFactor = 1.0
	}

	// Calculate days since last email
	daysSinceLastEmail := 365 // Default to a year if no email has been sent
	if user.LastEmailDate != nil {
		lastEmailDate, _ := time.Parse(time.RFC3339, *user.LastEmailDate)
		daysSinceLastEmail = int(time.Since(lastEmailDate).Hours() / 24)
	}

	// Lower score = higher risk of disengagement
	score := 100.0

	// Reduce score based on days since last order (higher impact)
	if daysSinceLastOrder > 90 {
		score -= 40
	} else if daysSinceLastOrder > 60 {
		score -= 30
	} else if daysSinceLastOrder > 30 {
		score -= 15
	}

	// Increase score based on order history
	score += orderCountFactor * 15
	score += aovFactor * 10

	// Adjust based on email recency
	if daysSinceLastEmail < MinDaysBetweenEmails {
		score -= 10 // Don't email too frequently
	}

	// Ensure score is between 0 and 100
	if score < 0 {
		score = 0
	} else if score > 100 {
		score = 100
	}

	return score
}

// Check if we should generate an email for a user
func shouldGenerateEmail(user User, engagementScore float64) bool {
	// Check if the engagement score is below the threshold
	if engagementScore > EngagementScoreThreshold {
		return false
	}

	// Check if we've sent an email recently
	if user.LastEmailDate != nil {
		lastEmailDate, _ := time.Parse(time.RFC3339, *user.LastEmailDate)
		daysSinceLastEmail := int(time.Since(lastEmailDate).Hours() / 24)
		if daysSinceLastEmail < MinDaysBetweenEmails {
			return false
		}
	}

	return true
}

// Generate an email for a user
func generateEmail(ctx context.Context, user User, engagementScore float64) (Email, error) {
	// Generate a subject and content using OpenAI
	subject, content, err := generateEmailContent(ctx, user)
	if err != nil {
		return Email{}, fmt.Errorf("error generating email content: %w", err)
	}

	// Create the email
	email := Email{
		EmailID:               generateUUID(),
		UserID:                user.UserID,
		Subject:               subject,
		Content:               content,
		GeneratedAt:           time.Now().Format(time.RFC3339),
		EngagementScoreAtTime: engagementScore,
		Status:                EmailStatusGenerated,
		CreatedAt:             time.Now().Format(time.RFC3339),
	}

	return email, nil
}

// Generate email content using OpenAI
func generateEmailContent(ctx context.Context, user User) (string, string, error) {
	// Create a prompt for OpenAI
	prompt := fmt.Sprintf(`
Generate a personalized email for a Stitch Fix customer with the following information:
- Name: %s
- Last order date: %s
- Number of orders: %d
- Average order value: $%.2f
- Preferred categories: %v

The email should:
1. Be friendly and personalized
2. Mention their previous order history
3. Suggest new items based on their preferred categories
4. Include a clear call to action to visit the Stitch Fix website
5. Include a subject line

Format the response as JSON with "subject" and "content" fields.
`, user.Name, user.LastOrderDate, user.OrderCount, user.AverageOrderValue, user.PreferredCategories)

	// Call OpenAI API
	resp, err := openaiClient.CreateChatCompletion(
		ctx,
		openai.ChatCompletionRequest{
			Model: openai.GPT4,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: prompt,
				},
			},
			Temperature: 0.7,
		},
	)
	if err != nil {
		return "", "", fmt.Errorf("error calling OpenAI API: %w", err)
	}

	// Parse the response
	var result struct {
		Subject string `json:"subject"`
		Content string `json:"content"`
	}
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &result); err != nil {
		// If parsing fails, use the raw response
		return "Check out what's new at Stitch Fix", resp.Choices[0].Message.Content, nil
	}

	return result.Subject, result.Content, nil
}

// Save an email to DynamoDB
func saveEmailToDynamoDB(ctx context.Context, email Email) error {
	// Convert the email to a DynamoDB item
	item := map[string]types.AttributeValue{
		"emailId": &types.AttributeValueMemberS{
			Value: email.EmailID,
		},
		"userId": &types.AttributeValueMemberS{
			Value: email.UserID,
		},
		"subject": &types.AttributeValueMemberS{
			Value: email.Subject,
		},
		"content": &types.AttributeValueMemberS{
			Value: email.Content,
		},
		"generatedAt": &types.AttributeValueMemberS{
			Value: email.GeneratedAt,
		},
		"engagementScoreAtTime": &types.AttributeValueMemberN{
			Value: strconv.FormatFloat(email.EngagementScoreAtTime, 'f', 2, 64),
		},
		"status": &types.AttributeValueMemberS{
			Value: email.Status,
		},
		"createdAt": &types.AttributeValueMemberS{
			Value: email.CreatedAt,
		},
	}

	// Put the item in DynamoDB
	_, err := dynamoClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(EmailsTableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("error putting item in DynamoDB: %w", err)
	}

	return nil
}

// Send an email using SES
func sendEmail(ctx context.Context, email Email, user User) error {
	// Create the email request
	input := &ses.SendEmailInput{
		Destination: &sestypes.Destination{
			ToAddresses: []string{user.Email},
		},
		Message: &sestypes.Message{
			Body: &sestypes.Body{
				Html: &sestypes.Content{
					Charset: aws.String("UTF-8"),
					Data:    aws.String(email.Content),
				},
			},
			Subject: &sestypes.Content{
				Charset: aws.String("UTF-8"),
				Data:    aws.String(email.Subject),
			},
		},
		Source: aws.String("noreply@stitchfix.com"),
	}

	// Send the email
	_, err := sesClient.SendEmail(ctx, input)
	if err != nil {
		// Update the email status to failed
		if updateErr := updateEmailStatus(ctx, email.EmailID, EmailStatusFailed); updateErr != nil {
			log.Printf("Error updating email status: %v", updateErr)
		}
		return fmt.Errorf("error sending email: %w", err)
	}

	// Update the email status to sent
	if err := updateEmailStatus(ctx, email.EmailID, EmailStatusSent); err != nil {
		log.Printf("Error updating email status: %v", err)
	}

	return nil
}

// Update the status of an email in DynamoDB
func updateEmailStatus(ctx context.Context, emailID, status string) error {
	// Update the item in DynamoDB
	_, err := dynamoClient.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(EmailsTableName),
		Key: map[string]types.AttributeValue{
			"emailId": &types.AttributeValueMemberS{
				Value: emailID,
			},
		},
		UpdateExpression: aws.String("SET #status = :status"),
		ExpressionAttributeNames: map[string]string{
			"#status": "status",
		},
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":status": &types.AttributeValueMemberS{
				Value: status,
			},
		},
	})
	if err != nil {
		return fmt.Errorf("error updating item in DynamoDB: %w", err)
	}

	return nil
}

// Update a user's engagement score in DynamoDB
func updateUserEngagementScore(ctx context.Context, userID string, engagementScore float64) error {
	// Update the item in DynamoDB
	_, err := dynamoClient.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(UsersTableName),
		Key: map[string]types.AttributeValue{
			"userId": &types.AttributeValueMemberS{
				Value: userID,
			},
		},
		UpdateExpression: aws.String("SET engagementScore = :engagementScore, updatedAt = :updatedAt"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":engagementScore": &types.AttributeValueMemberN{
				Value: strconv.FormatFloat(engagementScore, 'f', 2, 64),
			},
			":updatedAt": &types.AttributeValueMemberS{
				Value: time.Now().Format(time.RFC3339),
			},
		},
	})
	if err != nil {
		return fmt.Errorf("error updating item in DynamoDB: %w", err)
	}

	return nil
}

// Update a user's last email date in DynamoDB
func updateUserLastEmailDate(ctx context.Context, userID string) error {
	// Update the item in DynamoDB
	_, err := dynamoClient.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(UsersTableName),
		Key: map[string]types.AttributeValue{
			"userId": &types.AttributeValueMemberS{
				Value: userID,
			},
		},
		UpdateExpression: aws.String("SET lastEmailDate = :lastEmailDate, updatedAt = :updatedAt"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":lastEmailDate": &types.AttributeValueMemberS{
				Value: time.Now().Format(time.RFC3339),
			},
			":updatedAt": &types.AttributeValueMemberS{
				Value: time.Now().Format(time.RFC3339),
			},
		},
	})
	if err != nil {
		return fmt.Errorf("error updating item in DynamoDB: %w", err)
	}

	return nil
}

// Get a user from DynamoDB
func getUserFromDynamoDB(ctx context.Context, userID string) (User, error) {
	// Get the item from DynamoDB
	result, err := dynamoClient.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(UsersTableName),
		Key: map[string]types.AttributeValue{
			"userId": &types.AttributeValueMemberS{
				Value: userID,
			},
		},
	})
	if err != nil {
		return User{}, fmt.Errorf("error getting item from DynamoDB: %w", err)
	}

	// Check if the item exists
	if result.Item == nil {
		return User{}, fmt.Errorf("user not found: %s", userID)
	}

	// Parse the item
	user := User{
		UserID: userID,
	}

	// Parse the email
	if email, ok := result.Item["email"].(*types.AttributeValueMemberS); ok {
		user.Email = email.Value
	}

	// Parse the name
	if name, ok := result.Item["name"].(*types.AttributeValueMemberS); ok {
		user.Name = name.Value
	}

	// Parse the last order date
	if lastOrderDate, ok := result.Item["lastOrderDate"].(*types.AttributeValueMemberS); ok {
		user.LastOrderDate = lastOrderDate.Value
	}

	// Parse the order count
	if orderCount, ok := result.Item["orderCount"].(*types.AttributeValueMemberN); ok {
		user.OrderCount, _ = strconv.Atoi(orderCount.Value)
	}

	// Parse the average order value
	if aov, ok := result.Item["averageOrderValue"].(*types.AttributeValueMemberN); ok {
		user.AverageOrderValue, _ = strconv.ParseFloat(aov.Value, 64)
	}

	// Parse the preferred categories
	if categories, ok := result.Item["preferredCategories"].(*types.AttributeValueMemberL); ok {
		for _, category := range categories.Value {
			if categoryStr, ok := category.(*types.AttributeValueMemberS); ok {
				user.PreferredCategories = append(user.PreferredCategories, categoryStr.Value)
			}
		}
	}

	// Parse the engagement score
	if engagementScore, ok := result.Item["engagementScore"].(*types.AttributeValueMemberN); ok {
		score, _ := strconv.ParseFloat(engagementScore.Value, 64)
		user.EngagementScore = &score
	}

	// Parse the last email date
	if lastEmailDate, ok := result.Item["lastEmailDate"].(*types.AttributeValueMemberS); ok {
		user.LastEmailDate = &lastEmailDate.Value
	}

	// Parse the created at
	if createdAt, ok := result.Item["createdAt"].(*types.AttributeValueMemberS); ok {
		user.CreatedAt = createdAt.Value
	}

	// Parse the updated at
	if updatedAt, ok := result.Item["updatedAt"].(*types.AttributeValueMemberS); ok {
		user.UpdatedAt = updatedAt.Value
	}

	return user, nil
}

// Generate a UUID
func generateUUID() string {
	// This is a simplified implementation
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

func main() {
	lambda.Start(handler)
}
