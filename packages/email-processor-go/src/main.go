package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"runtime"
	"strconv"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

// Debug logging levels
const (
	DEBUG_INFO    = "[INFO] "
	DEBUG_WARNING = "[WARNING] "
	DEBUG_ERROR   = "[ERROR] "
	DEBUG_FATAL   = "[FATAL] "
)

// Debug logger function
func debugLog(level string, format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	log.Printf("%s%s", level, message)
}

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

// DynamoDB table names (will be overridden by environment variables)
var (
	UsersTableName  = "StitchFixClientEngagementStack-UsersTable9725E9C8-MG34X4JZZ63F"
	EmailsTableName = "StitchFixClientEngagementStack-EmailsTableF5BA4582-1D3RH80AYSU10"
)

// OpenRouter API types
type OpenRouterMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenRouterResponseFormat struct {
	Type       string               `json:"type"`
	JSONSchema OpenRouterJSONSchema `json:"json_schema"`
}

type OpenRouterJSONSchema struct {
	Name   string                 `json:"name"`
	Strict bool                   `json:"strict"`
	Schema map[string]interface{} `json:"schema"`
}

type OpenRouterRequest struct {
	Model          string                    `json:"model"`
	Messages       []OpenRouterMessage       `json:"messages"`
	ResponseFormat *OpenRouterResponseFormat `json:"response_format,omitempty"`
}

type OpenRouterChoice struct {
	Message struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	} `json:"message"`
}

type OpenRouterResponse struct {
	ID      string             `json:"id"`
	Choices []OpenRouterChoice `json:"choices"`
}

// Email content schema for structured output
type EmailContent struct {
	Subject string `json:"subject"`
	Content string `json:"content"`
}

// Global clients
var (
	dynamoClient     *dynamodb.Client
	httpClient       *http.Client
	openRouterApiKey string
)

func init() {
	debugLog(DEBUG_INFO, "Initializing email processor Lambda")
	// Initialize AWS SDK clients
	debugLog(DEBUG_INFO, "Loading AWS SDK configuration")
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		debugLog(DEBUG_FATAL, "Failed to load AWS SDK config: %v", err)
		log.Fatalf("Failed to load AWS SDK config: %v", err)
	}
	debugLog(DEBUG_INFO, "Creating DynamoDB client")
	dynamoClient = dynamodb.NewFromConfig(cfg)

	// Initialize HTTP client for OpenRouter
	debugLog(DEBUG_INFO, "Initializing HTTP client for OpenRouter API")
	httpClient = &http.Client{
		Timeout: time.Second * 30,
	}

	// Get OpenRouter API key
	openRouterApiKey = os.Getenv("OPENROUTER_API_KEY")
	if openRouterApiKey == "" {
		debugLog(DEBUG_WARNING, "OPENROUTER_API_KEY environment variable is not set")
	} else {
		keyLength := len(openRouterApiKey)
		if keyLength > 8 {
			// Log first and last 4 chars of the key for debugging, masking the middle
			debugLog(DEBUG_INFO, "OPENROUTER_API_KEY found with length %d: %s...%s",
				keyLength, openRouterApiKey[:4], openRouterApiKey[keyLength-4:])
		} else {
			debugLog(DEBUG_INFO, "OPENROUTER_API_KEY found but is suspiciously short (%d chars)", keyLength)
		}
	}

	// Get table names from environment variables
	debugLog(DEBUG_INFO, "Default UsersTableName: %s", UsersTableName)
	debugLog(DEBUG_INFO, "Default EmailsTableName: %s", EmailsTableName)

	if tableName := os.Getenv("USERS_TABLE_NAME"); tableName != "" {
		UsersTableName = tableName
		debugLog(DEBUG_INFO, "Using users table from environment: %s", UsersTableName)
	} else {
		debugLog(DEBUG_WARNING, "USERS_TABLE_NAME environment variable not set, using default: %s", UsersTableName)
	}

	if tableName := os.Getenv("EMAILS_TABLE_NAME"); tableName != "" {
		EmailsTableName = tableName
		debugLog(DEBUG_INFO, "Using emails table from environment: %s", EmailsTableName)
	} else {
		debugLog(DEBUG_WARNING, "EMAILS_TABLE_NAME environment variable not set, using default: %s", EmailsTableName)
	}

	debugLog(DEBUG_INFO, "Email processor Lambda initialization complete")
}

// Lambda handler function
func handler(ctx context.Context, sqsEvent events.SQSEvent) error {
	// Add panic recovery to catch and log any crashes
	defer recoverPanic()

	debugLog(DEBUG_INFO, "Lambda handler invoked with %d SQS messages", len(sqsEvent.Records))
	debugLog(DEBUG_INFO, "Lambda handler invoked with %d SQS messages", len(sqsEvent.Records))

	for i, message := range sqsEvent.Records {
		debugLog(DEBUG_INFO, "[%d/%d] Processing message: %s", i+1, len(sqsEvent.Records), message.MessageId)
		debugLog(DEBUG_INFO, "Message body: %s", message.Body)

		// Parse the SNS message from the SQS event
		var snsMessage map[string]interface{}
		if err := json.Unmarshal([]byte(message.Body), &snsMessage); err != nil {
			debugLog(DEBUG_ERROR, "Error parsing SNS message: %v", err)
			continue
		}

		// Log SNS message details
		debugLog(DEBUG_INFO, "SNS message parsed successfully: %+v", snsMessage)

		// Extract the actual message from the SNS envelope
		messageStr, ok := snsMessage["Message"].(string)
		if !ok {
			debugLog(DEBUG_ERROR, "Error: SNS message does not contain a Message field. Keys found: %v", getMapKeys(snsMessage))
			continue
		}

		debugLog(DEBUG_INFO, "Extracted Message from SNS: %s", messageStr)

		// Parse the event
		var event Event
		if err := json.Unmarshal([]byte(messageStr), &event); err != nil {
			debugLog(DEBUG_ERROR, "Error parsing event: %v", err)
			debugLog(DEBUG_ERROR, "Raw message content: %s", messageStr)
			continue
		}

		debugLog(DEBUG_INFO, "Event parsed successfully - Type: %s, Timestamp: %s", event.Type, event.Timestamp)

		// Process the event based on its type
		switch event.Type {
		case EventTypeUserCreated, EventTypeUserUpdated:
			debugLog(DEBUG_INFO, "Processing %s event", event.Type)

			var user User
			if err := json.Unmarshal(event.Payload, &user); err != nil {
				debugLog(DEBUG_ERROR, "Error parsing user payload: %v", err)
				debugLog(DEBUG_ERROR, "Raw payload: %s", string(event.Payload))
				continue
			}

			debugLog(DEBUG_INFO, "User data parsed successfully - UserID: %s, Name: %s, Email: %s",
				user.UserID, user.Name, user.Email)

			if err := processUser(ctx, user); err != nil {
				debugLog(DEBUG_ERROR, "Error processing user: %v", err)
			} else {
				debugLog(DEBUG_INFO, "User processed successfully: %s", user.UserID)
			}

		case EventTypeOrderCreated, EventTypeOrderUpdated:
			debugLog(DEBUG_INFO, "Processing %s event", event.Type)

			// Get the user ID from the order
			var orderData map[string]interface{}
			if err := json.Unmarshal(event.Payload, &orderData); err != nil {
				debugLog(DEBUG_ERROR, "Error parsing order payload: %v", err)
				debugLog(DEBUG_ERROR, "Raw payload: %s", string(event.Payload))
				continue
			}

			debugLog(DEBUG_INFO, "Order data parsed successfully: %+v", orderData)

			userID, ok := orderData["userId"].(string)
			if !ok {
				debugLog(DEBUG_ERROR, "Error: Order does not contain a userId field. Keys found: %v", getMapKeys(orderData))
				continue
			}

			debugLog(DEBUG_INFO, "Extracted userID from order: %s", userID)

			// Get the user from DynamoDB
			debugLog(DEBUG_INFO, "Fetching user from DynamoDB: %s", userID)
			user, err := getUserFromDynamoDB(ctx, userID)
			if err != nil {
				debugLog(DEBUG_ERROR, "Error getting user from DynamoDB: %v", err)
				continue
			}

			debugLog(DEBUG_INFO, "User fetched successfully from DynamoDB - UserID: %s, Name: %s",
				user.UserID, user.Name)

			// Process the user
			if err := processUser(ctx, user); err != nil {
				debugLog(DEBUG_ERROR, "Error processing user: %v", err)
			} else {
				debugLog(DEBUG_INFO, "User processed successfully: %s", user.UserID)
			}

		default:
			debugLog(DEBUG_WARNING, "Ignoring event of type: %s", event.Type)
		}
	}

	debugLog(DEBUG_INFO, "Lambda handler completed successfully")
	return nil
}

// Helper function to get map keys for debugging
func getMapKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys

	return nil
}

// Process a user and generate an email if needed
func processUser(ctx context.Context, user User) error {
	// Add panic recovery to catch and log any crashes
	defer recoverPanic()

	debugLog(DEBUG_INFO, "Processing user: %s", user.UserID)
	debugLog(DEBUG_INFO, "User details: Name=%s, Email=%s, LastOrderDate=%s, OrderCount=%d, AverageOrderValue=%.2f",
		user.Name, user.Email, user.LastOrderDate, user.OrderCount, user.AverageOrderValue)

	if user.EngagementScore != nil {
		debugLog(DEBUG_INFO, "User already has engagement score: %.2f", *user.EngagementScore)
	}

	if user.LastEmailDate != nil {
		debugLog(DEBUG_INFO, "User last email date: %s", *user.LastEmailDate)
	} else {
		debugLog(DEBUG_INFO, "User has no previous emails")
	}
	// Use the existing engagement score from the database instead of recalculating
	var engagementScore float64
	if user.EngagementScore != nil {
		engagementScore = *user.EngagementScore
		debugLog(DEBUG_INFO, "Using existing engagement score from database: %.2f", engagementScore)
	} else {
		// If no engagement score exists, use a default low score to trigger email generation
		engagementScore = 10.0
		debugLog(DEBUG_INFO, "No existing score, using default low score: %.2f", engagementScore)

		// Update the user's engagement score in DynamoDB
		debugLog(DEBUG_INFO, "Updating user engagement score in DynamoDB: %s -> %.2f", user.UserID, engagementScore)
		if err := updateUserEngagementScore(ctx, user.UserID, engagementScore); err != nil {
			debugLog(DEBUG_ERROR, "Error updating user engagement score: %v", err)
			return fmt.Errorf("error updating user engagement score: %w", err)
		}
		debugLog(DEBUG_INFO, "Successfully updated engagement score in DynamoDB")
	}
	debugLog(DEBUG_INFO, "Successfully updated engagement score in DynamoDB")

	// Check if we should generate an email
	debugLog(DEBUG_INFO, "Checking if we should generate an email for user: %s (score: %.2f, threshold: %.2f)",
		user.UserID, engagementScore, EngagementScoreThreshold)
	shouldGenerate := shouldGenerateEmail(user, engagementScore)
	debugLog(DEBUG_INFO, "Should generate email decision: %v", shouldGenerate)

	if shouldGenerate {
		debugLog(DEBUG_INFO, "Generating email for user: %s", user.UserID)

		// Generate the email
		debugLog(DEBUG_INFO, "Calling generateEmail for user: %s", user.UserID)
		email, err := generateEmail(ctx, user, engagementScore)
		if err != nil {
			debugLog(DEBUG_ERROR, "Error generating email: %v", err)
			return fmt.Errorf("error generating email: %w", err)
		}
		debugLog(DEBUG_INFO, "Email generated successfully - EmailID: %s, Subject: %s", email.EmailID, email.Subject)

		// Save the email to DynamoDB
		debugLog(DEBUG_INFO, "Saving email to DynamoDB - EmailID: %s", email.EmailID)
		if err := saveEmailToDynamoDB(ctx, email); err != nil {
			debugLog(DEBUG_ERROR, "Error saving email to DynamoDB: %v", err)
			return fmt.Errorf("error saving email to DynamoDB: %w", err)
		}
		debugLog(DEBUG_INFO, "Email saved to DynamoDB successfully")

		// Send the email
		debugLog(DEBUG_INFO, "Sending email via SES - EmailID: %s, To: %s", email.EmailID, user.Email)
		if err := sendEmail(ctx, email, user); err != nil {
			debugLog(DEBUG_ERROR, "Error sending email: %v", err)
			return fmt.Errorf("error sending email: %w", err)
		}
		debugLog(DEBUG_INFO, "Email sent successfully")

		// Update the user's last email date in DynamoDB
		debugLog(DEBUG_INFO, "Updating user's last email date in DynamoDB: %s", user.UserID)
		if err := updateUserLastEmailDate(ctx, user.UserID); err != nil {
			debugLog(DEBUG_ERROR, "Error updating user last email date: %v", err)
			return fmt.Errorf("error updating user last email date: %w", err)
		}
		debugLog(DEBUG_INFO, "User's last email date updated successfully")
	} else {
		debugLog(DEBUG_INFO, "Not generating email for user: %s (score: %.2f is above threshold: %.2f or email too recent)",
			user.UserID, engagementScore, EngagementScoreThreshold)
	}

	debugLog(DEBUG_INFO, "User processing completed successfully: %s", user.UserID)
	return nil
}

// Calculate the engagement score for a user
func calculateEngagementScore(user User) float64 {
	// Add panic recovery to catch and log any crashes
	defer recoverPanic()

	debugLog(DEBUG_INFO, "Calculating engagement score for user: %s", user.UserID)

	// Calculate days since last order
	lastOrderDate, err := time.Parse(time.RFC3339, user.LastOrderDate)
	if err != nil {
		debugLog(DEBUG_ERROR, "Error parsing last order date: %v, using current time", err)
		lastOrderDate = time.Now()
	}
	daysSinceLastOrder := int(time.Since(lastOrderDate).Hours() / 24)
	debugLog(DEBUG_INFO, "Days since last order: %d", daysSinceLastOrder)

	// Calculate order count factor (max 1.0)
	orderCountFactor := float64(user.OrderCount) / 10
	if orderCountFactor > 1.0 {
		orderCountFactor = 1.0
	}
	debugLog(DEBUG_INFO, "Order count: %d, factor: %.2f", user.OrderCount, orderCountFactor)

	// Calculate average order value factor (max 1.0)
	aovFactor := user.AverageOrderValue / 200
	if aovFactor > 1.0 {
		aovFactor = 1.0
	}
	debugLog(DEBUG_INFO, "Average order value: $%.2f, factor: %.2f", user.AverageOrderValue, aovFactor)

	// Calculate days since last email
	daysSinceLastEmail := 365 // Default to a year if no email has been sent
	if user.LastEmailDate != nil {
		lastEmailDate, err := time.Parse(time.RFC3339, *user.LastEmailDate)
		if err != nil {
			debugLog(DEBUG_ERROR, "Error parsing last email date: %v, using default (365 days)", err)
		} else {
			daysSinceLastEmail = int(time.Since(lastEmailDate).Hours() / 24)
			debugLog(DEBUG_INFO, "Days since last email: %d", daysSinceLastEmail)
		}
	} else {
		debugLog(DEBUG_INFO, "No previous emails sent, using default days since last email: %d", daysSinceLastEmail)
	}

	// Lower score = higher risk of disengagement
	score := 100.0
	debugLog(DEBUG_INFO, "Starting score: %.2f", score)

	// Reduce score based on days since last order (higher impact)
	if daysSinceLastOrder > 90 {
		debugLog(DEBUG_INFO, "Reducing score by 40 (days since last order > 90)")
		score -= 40
	} else if daysSinceLastOrder > 60 {
		debugLog(DEBUG_INFO, "Reducing score by 30 (days since last order > 60)")
		score -= 30
	} else if daysSinceLastOrder > 30 {
		debugLog(DEBUG_INFO, "Reducing score by 15 (days since last order > 30)")
		score -= 15
	} else {
		debugLog(DEBUG_INFO, "No reduction for recent order (days since last order: %d)", daysSinceLastOrder)
	}
	debugLog(DEBUG_INFO, "Score after order recency adjustment: %.2f", score)

	// Increase score based on order history
	orderHistoryBonus := orderCountFactor * 15
	debugLog(DEBUG_INFO, "Adding %.2f to score based on order count", orderHistoryBonus)
	score += orderHistoryBonus

	aovBonus := aovFactor * 10
	debugLog(DEBUG_INFO, "Adding %.2f to score based on average order value", aovBonus)
	score += aovBonus

	debugLog(DEBUG_INFO, "Score after order history adjustments: %.2f", score)

	// Adjust based on email recency
	if daysSinceLastEmail < MinDaysBetweenEmails {
		debugLog(DEBUG_INFO, "Reducing score by 10 (recent email: %d days, minimum: %d days)",
			daysSinceLastEmail, MinDaysBetweenEmails)
		score -= 10 // Don't email too frequently
	} else {
		debugLog(DEBUG_INFO, "No reduction for email recency (days since last email: %d)", daysSinceLastEmail)
	}
	debugLog(DEBUG_INFO, "Score after email recency adjustment: %.2f", score)

	// Ensure score is between 0 and 100
	originalScore := score
	if score < 0 {
		debugLog(DEBUG_INFO, "Clamping score from %.2f to 0.0 (minimum)", score)
		score = 0
	} else if score > 100 {
		debugLog(DEBUG_INFO, "Clamping score from %.2f to 100.0 (maximum)", score)
		score = 100
	}

	if originalScore != score {
		debugLog(DEBUG_INFO, "Final score (after clamping): %.2f", score)
	} else {
		debugLog(DEBUG_INFO, "Final score: %.2f", score)
	}

	return score
}

// Check if we should generate an email for a user
func shouldGenerateEmail(user User, engagementScore float64) bool {
	debugLog(DEBUG_INFO, "Evaluating if we should generate email for user %s", user.UserID)
	debugLog(DEBUG_INFO, "Current engagement score: %.2f, threshold: %.2f", engagementScore, EngagementScoreThreshold)

	// Check if the engagement score is below the threshold
	if engagementScore > EngagementScoreThreshold {
		debugLog(DEBUG_INFO, "Engagement score %.2f is ABOVE threshold %.2f - NOT generating email",
			engagementScore, EngagementScoreThreshold)
		return false
	}

	debugLog(DEBUG_INFO, "Engagement score %.2f is BELOW threshold %.2f - continuing evaluation",
		engagementScore, EngagementScoreThreshold)

	// Check if we've sent an email recently
	if user.LastEmailDate != nil {
		lastEmailDate, err := time.Parse(time.RFC3339, *user.LastEmailDate)
		if err != nil {
			debugLog(DEBUG_WARNING, "Error parsing last email date: %v - treating as no previous email", err)
		} else {
			daysSinceLastEmail := int(time.Since(lastEmailDate).Hours() / 24)
			debugLog(DEBUG_INFO, "Days since last email: %d, minimum days between emails: %d",
				daysSinceLastEmail, MinDaysBetweenEmails)

			if daysSinceLastEmail < MinDaysBetweenEmails {
				debugLog(DEBUG_INFO, "Last email was too recent (%d days ago, minimum is %d days) - NOT generating email",
					daysSinceLastEmail, MinDaysBetweenEmails)
				return false
			}

			debugLog(DEBUG_INFO, "Last email was sent %d days ago, which is >= minimum %d days - continuing evaluation",
				daysSinceLastEmail, MinDaysBetweenEmails)
		}
	} else {
		debugLog(DEBUG_INFO, "User has no previous emails - continuing evaluation")
	}

	debugLog(DEBUG_INFO, "All criteria passed - SHOULD generate email for user %s", user.UserID)
	return true
}

// Generate an email for a user
func generateEmail(ctx context.Context, user User, engagementScore float64) (Email, error) {
	// Generate a subject and content using OpenRouter
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

// Generate email content using OpenRouter
func generateEmailContent(ctx context.Context, user User) (string, string, error) {
	// Add panic recovery to catch and log any crashes
	defer recoverPanic()

	debugLog(DEBUG_INFO, "Generating email content for user: %s", user.UserID)

	// Create a prompt for OpenRouter
	debugLog(DEBUG_INFO, "Creating prompt with user data: Name=%s, LastOrderDate=%s, OrderCount=%d, AverageOrderValue=%.2f",
		user.Name, user.LastOrderDate, user.OrderCount, user.AverageOrderValue)

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

YOU MUST RESPOND WITH VALID JSON in the following format:
{
	 "subject": "Engaging subject line here",
	 "content": "HTML formatted email content here with <p> tags"
}

The content should be valid HTML with paragraph tags.
`, user.Name, user.LastOrderDate, user.OrderCount, user.AverageOrderValue, user.PreferredCategories)

	// Use a model that better supports structured output
	model := "openai/gpt-4o"
	debugLog(DEBUG_INFO, "Using model: %s with structured output", model)

	// Create JSON schema for structured output
	emailSchema := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"subject": map[string]interface{}{
				"type":        "string",
				"description": "Email subject line that is engaging and relevant to the customer",
			},
			"content": map[string]interface{}{
				"type":        "string",
				"description": "HTML email content that is personalized and includes product recommendations",
			},
		},
		"required":             []string{"subject", "content"},
		"additionalProperties": false,
	}

	// Create the request body with structured output format
	requestBody := OpenRouterRequest{
		Model: model,
		Messages: []OpenRouterMessage{
			{
				Role:    "user",
				Content: prompt,
			},
		},
		ResponseFormat: &OpenRouterResponseFormat{
			Type: "json_schema",
			JSONSchema: OpenRouterJSONSchema{
				Name:   "email",
				Strict: true,
				Schema: emailSchema,
			},
		},
	}

	// Marshal the request body to JSON
	debugLog(DEBUG_INFO, "Marshaling request body to JSON")
	requestBodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		debugLog(DEBUG_ERROR, "Error marshaling request body: %v", err)
		return "", "", fmt.Errorf("error marshaling request body: %w", err)
	}

	// Create the HTTP request
	debugLog(DEBUG_INFO, "Creating HTTP request to OpenRouter API")
	req, err := http.NewRequestWithContext(
		ctx,
		"POST",
		"https://openrouter.ai/api/v1/chat/completions",
		bytes.NewBuffer(requestBodyBytes),
	)
	if err != nil {
		debugLog(DEBUG_ERROR, "Error creating HTTP request: %v", err)
		return "", "", fmt.Errorf("error creating HTTP request: %w", err)
	}

	// Set the headers
	debugLog(DEBUG_INFO, "Setting request headers")
	req.Header.Set("Content-Type", "application/json")

	if openRouterApiKey == "" {
		debugLog(DEBUG_ERROR, "OpenRouter API key is empty")
		return "", "", fmt.Errorf("OpenRouter API key is not set")
	}

	req.Header.Set("Authorization", "Bearer "+openRouterApiKey)
	req.Header.Set("HTTP-Referer", "https://stitchfix.com")

	// Send the request
	debugLog(DEBUG_INFO, "Sending request to OpenRouter API")
	resp, err := httpClient.Do(req)
	if err != nil {
		debugLog(DEBUG_ERROR, "Error sending HTTP request: %v", err)
		return "", "", fmt.Errorf("error sending HTTP request: %w", err)
	}
	defer resp.Body.Close()

	// Read the response body
	debugLog(DEBUG_INFO, "Reading response body, status code: %d", resp.StatusCode)
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		debugLog(DEBUG_ERROR, "Error reading response body: %v", err)
		return "", "", fmt.Errorf("error reading response body: %w", err)
	}

	// Check the status code
	if resp.StatusCode != http.StatusOK {
		debugLog(DEBUG_ERROR, "Error from OpenRouter API (status %d): %s", resp.StatusCode, string(responseBody))
		return "", "", fmt.Errorf("error from OpenRouter API: %s", string(responseBody))
	}

	// Parse the response
	debugLog(DEBUG_INFO, "Parsing OpenRouter API response")
	var openRouterResp OpenRouterResponse
	if err := json.Unmarshal(responseBody, &openRouterResp); err != nil {
		debugLog(DEBUG_ERROR, "Error parsing response: %v", err)
		debugLog(DEBUG_ERROR, "Raw response: %s", string(responseBody))
		return "", "", fmt.Errorf("error parsing response: %w", err)
	}

	// Check if we got any choices
	if len(openRouterResp.Choices) == 0 {
		debugLog(DEBUG_ERROR, "No choices in response")
		debugLog(DEBUG_ERROR, "Raw response: %s", string(responseBody))
		return "", "", fmt.Errorf("no choices in response")
	}

	debugLog(DEBUG_INFO, "Got response with %d choices", len(openRouterResp.Choices))
	debugLog(DEBUG_INFO, "Response content: %s", openRouterResp.Choices[0].Message.Content)

	// Parse the content as JSON
	debugLog(DEBUG_INFO, "Parsing content as JSON")
	var emailContent EmailContent
	if err := json.Unmarshal([]byte(openRouterResp.Choices[0].Message.Content), &emailContent); err != nil {
		debugLog(DEBUG_ERROR, "Error parsing content as JSON: %v", err)
		debugLog(DEBUG_ERROR, "Raw content: %s", openRouterResp.Choices[0].Message.Content)
		return "", "", fmt.Errorf("failed to parse OpenRouter response as JSON: %w", err)
	}

	// Validate the parsed content
	if emailContent.Subject == "" {
		debugLog(DEBUG_ERROR, "Empty subject in response")
		return "", "", fmt.Errorf("OpenRouter returned empty subject")
	}

	if emailContent.Content == "" {
		debugLog(DEBUG_ERROR, "Empty content in response")
		return "", "", fmt.Errorf("OpenRouter returned empty content")
	}

	debugLog(DEBUG_INFO, "Successfully generated email - Subject: %s, Content length: %d chars",
		emailContent.Subject, len(emailContent.Content))
	return emailContent.Subject, emailContent.Content, nil
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

// Send an email (mock implementation - just updates status)
func sendEmail(ctx context.Context, email Email, user User) error {
	// Add panic recovery to catch and log any crashes
	defer recoverPanic()

	debugLog(DEBUG_INFO, "Skipping actual email sending (SES) - this is a demo")

	// Update the email status to sent
	debugLog(DEBUG_INFO, "Updating email status to SENT in DynamoDB")
	if err := updateEmailStatus(ctx, email.EmailID, EmailStatusSent); err != nil {
		debugLog(DEBUG_ERROR, "Error updating email status: %v", err)
		return fmt.Errorf("error updating email status: %w", err)
	}

	debugLog(DEBUG_INFO, "Email status updated to SENT successfully")
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

// Panic handler to catch and log crashes
func recoverPanic() {
	if r := recover(); r != nil {
		// Get stack trace
		buf := make([]byte, 4096)
		n := runtime.Stack(buf, false)
		stackTrace := string(buf[:n])

		// Log the panic with stack trace
		debugLog(DEBUG_FATAL, "PANIC RECOVERED: %v\n\nStack Trace:\n%s", r, stackTrace)

		// Re-panic after logging if needed
		// panic(r)
	}
}

func main() {
	// Add import for runtime package at the top of the file
	defer recoverPanic()
	debugLog(DEBUG_INFO, "Starting email processor Lambda")
	lambda.Start(handler)
}
