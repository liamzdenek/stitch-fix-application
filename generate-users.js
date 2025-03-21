const { execSync } = require('child_process');
const fs = require('fs');

// Configuration
const TABLE_NAME = 'StitchFixClientEngagementStack-UsersTable9725E9C8-MG34X4JZZ63F';
const AWS_PROFILE = 'lz-demos';
const NUM_USERS = 20;

// First names
const firstNames = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'Jacob', 'Mia', 'William', 'Charlotte', 'James', 'Amelia',
  'Benjamin', 'Harper', 'Lucas', 'Evelyn', 'Alexander', 'Abigail', 'Michael',
  'Emily', 'Daniel', 'Elizabeth', 'Matthew', 'Sofia', 'Henry', 'Avery', 'Jackson'
];

// Last names
const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson',
  'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin',
  'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis',
  'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King'
];

// Product categories
const categories = [
  'pants', 'shirts', 'dresses', 'shoes', 'accessories', 'jackets',
  'sweaters', 'jeans', 'activewear', 'outerwear', 'skirts', 'blouses'
];

// Helper function to get random item from array
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

// Helper function to get random number between min and max (inclusive)
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper function to get random date between start and end
const getRandomDate = (start, end) => {
  const startDate = new Date(start).getTime();
  const endDate = new Date(end).getTime();
  const randomTime = startDate + Math.random() * (endDate - startDate);
  return new Date(randomTime).toISOString();
};

// Helper function to get random subset of array
const getRandomSubset = (array, min, max) => {
  const count = getRandomNumber(min, max);
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Delete all test users
console.log('Deleting test users...');
try {
  // Scan for test users
  const scanCommand = `aws dynamodb scan --table-name ${TABLE_NAME} --filter-expression "begins_with(userId, :prefix)" --expression-attribute-values '{":prefix":{"S":"test-"}}' --projection-expression "userId" --profile ${AWS_PROFILE}`;
  const scanResult = JSON.parse(execSync(scanCommand).toString());
  
  // Delete each test user
  if (scanResult.Items && scanResult.Items.length > 0) {
    console.log(`Found ${scanResult.Items.length} test users to delete`);
    scanResult.Items.forEach(item => {
      const userId = item.userId.S;
      console.log(`Deleting user: ${userId}`);
      const deleteCommand = `aws dynamodb delete-item --table-name ${TABLE_NAME} --key '{"userId":{"S":"${userId}"}}' --profile ${AWS_PROFILE}`;
      execSync(deleteCommand);
    });
  } else {
    console.log('No test users found');
  }
} catch (error) {
  console.error('Error deleting test users:', error.message);
}

// Generate realistic users
console.log(`\nGenerating ${NUM_USERS} realistic users...`);

for (let i = 1; i <= NUM_USERS; i++) {
  // Generate user data
  const firstName = getRandomItem(firstNames);
  const lastName = getRandomItem(lastNames);
  const fullName = `${firstName} ${lastName}`;
  const userId = `user-${i.toString().padStart(3, '0')}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
  
  // Generate order data
  const orderCount = getRandomNumber(0, 15);
  const averageOrderValue = getRandomNumber(25, 300);
  
  // Generate dates
  const createdAt = getRandomDate('2024-01-01', '2025-01-01');
  const updatedAt = getRandomDate(createdAt, '2025-03-21');
  
  // For users with orders, generate last order date
  let lastOrderDate = null;
  if (orderCount > 0) {
    lastOrderDate = getRandomDate('2024-01-01', '2025-03-15');
  } else {
    lastOrderDate = createdAt;
  }
  
  // Generate preferred categories (2-4 random categories)
  const preferredCategories = getRandomSubset(categories, 2, 4);
  
  // Calculate engagement score (lower for users with fewer/older orders)
  let engagementScore;
  const daysSinceLastOrder = Math.floor((new Date() - new Date(lastOrderDate)) / (1000 * 60 * 60 * 24));
  
  if (orderCount === 0) {
    engagementScore = getRandomNumber(5, 20); // Very low for users with no orders
  } else if (daysSinceLastOrder > 90) {
    engagementScore = getRandomNumber(15, 40); // Low for users with old orders
  } else if (orderCount < 3) {
    engagementScore = getRandomNumber(30, 60); // Medium for users with few orders
  } else {
    engagementScore = getRandomNumber(50, 90); // High for users with many recent orders
  }
  
  // Create the DynamoDB item
  const userItem = {
    userId: { S: userId },
    email: { S: email },
    name: { S: fullName },
    lastOrderDate: { S: lastOrderDate },
    orderCount: { N: orderCount.toString() },
    averageOrderValue: { N: averageOrderValue.toString() },
    preferredCategories: { 
      L: preferredCategories.map(category => ({ S: category }))
    },
    engagementScore: { N: engagementScore.toString() },
    createdAt: { S: createdAt },
    updatedAt: { S: updatedAt }
  };
  
  // Add lastEmailDate for some users
  if (Math.random() > 0.7 && orderCount > 0) {
    const lastEmailDate = getRandomDate(lastOrderDate, updatedAt);
    userItem.lastEmailDate = { S: lastEmailDate };
  }
  
  // Convert to JSON string for AWS CLI
  const itemJson = JSON.stringify(userItem).replace(/"/g, '\\"');
  
  // Create the user in DynamoDB
  console.log(`Creating user ${i}/${NUM_USERS}: ${fullName} (${userId})`);
  const putCommand = `aws dynamodb put-item --table-name ${TABLE_NAME} --item "${itemJson}" --profile ${AWS_PROFILE}`;
  
  try {
    execSync(putCommand);
  } catch (error) {
    console.error(`Error creating user ${userId}:`, error.message);
  }
}

console.log('\nUser generation complete!');