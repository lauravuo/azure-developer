import * as path from "path";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get environment variables from .env
import * as dotenv from "dotenv";
dotenv.config();

// Get Cosmos Client
import { CosmosClient } from "@azure/cosmos";

// Provide required connection from environment variables
const cosmosSecret = process.env.COSMOS_CONNECTION_STRING;

// Authenticate to Azure Cosmos DB
const cosmosClient = new CosmosClient(cosmosSecret);

// Set Database name and container name
const databaseName = process.env.COSMOS_DATABASE_NAME;
const containerName = process.env.COSMOS_CONTAINER_NAME;
const partitionKeyPath = [`/${process.env.COSMOS_CONTAINER_PARTITION_KEY}`];

// Create DB if it doesn't exist
const { database } = await cosmosClient.databases.createIfNotExists({
  id: databaseName,
});

// Create container if it doesn't exist
const { container } = await database.containers.createIfNotExists({
  id: containerName,
  partitionKey: {
    paths: partitionKeyPath,
  },
});

// Execute query
// SQL Query specification
const querySpec = {
  // SQL query text using LIKE keyword and parameter
  query: `select * from products p where p.name LIKE @propertyValue`,
  // Optional SQL parameters, to be used in query
  parameters: [
    {
      // name of property to find in query text
      name: "@propertyValue",
      // value to insert in place of property
      value: `%Blue%`,
    }
  ]
};
const { resources } = await container.items.query(querySpec).fetchAll();

let i = 0;

// Show results of query
for (const item of resources) {
  console.log(`${++i}: ${item.id}: ${item.name}, ${item.sku}`);
}

// Find all products that match a property with a value like `value`
async function executeSqlFind(property, value) {
  // Build query
  const querySpec = {
    query: `select * from products p where p.${property} LIKE @propertyValue`,
    parameters: [
      {
        name: "@propertyValue",
        value: `${value}`,
      },
    ],
  };

  // Show query
  console.log(querySpec);

  // Get results
  const { resources } = await container.items.query(querySpec).fetchAll();

  let i = 0;

  // Show results of query
  for (const item of resources) {
    console.log(`${++i}: ${item.id}: ${item.name}, ${item.sku}`);
  }
}

executeSqlFind("categoryName", "Bikes, Touring Bikes");

async function executeSqlInventory(propertyName, propertyValue, locationPropertyName, locationPropertyValue) {
  // Build query
  const querySpec = {
    query: `select p.id, p.name, i.location, i.inventory from products p JOIN i IN p.inventory where p.${propertyName} LIKE @propertyValue AND i.${locationPropertyName}=@locationPropertyValue`,

    parameters: [
      {
        name: "@propertyValue",
        value: `${propertyValue}`,
      },
      {
        name: "@locationPropertyValue",
        value: `${locationPropertyValue}`
      },
    ],
  };

  // Show query
  console.log(querySpec);

  // Get results
  const { resources } = await container.items.query(querySpec).fetchAll();

  let i = 0;

  // Show results of query
  console.log(`Looking for ${propertyName}=${propertyValue}, ${locationPropertyName}=${locationPropertyValue}`);
  for (const item of resources) {
    console.log(
      `${++i}: ${item.id}: '${item.name}': current inventory = ${item.inventory
      }`
    );
  }
}

executeSqlInventory("name", "%Blue%", "location", "Dallas");