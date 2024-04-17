const { BlobServiceClient } = require("@azure/storage-blob");
const { v1: uuidv1 } = require("uuid");
require("dotenv").config();

// Convert stream to text
async function streamToText(readable) {
  readable.setEncoding('utf8');
  let data = '';
  for await (const chunk of readable) {
    data += chunk;
  }
  return data;
}

async function main() {
  try {
    console.log("Azure Blob storage v12 - JavaScript quickstart sample");

    // Quick start code goes here
    // ***************** CREATE SERVICE CLIENT ***************** 
    const AZURE_STORAGE_CONNECTION_STRING =
      process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!AZURE_STORAGE_CONNECTION_STRING) {
      throw Error('Azure Storage Connection string not found');
    }

    // The BlobServiceClient class allows you to manipulate Azure Storage resources and blob containers.
    // Create the BlobServiceClient object with connection string
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      AZURE_STORAGE_CONNECTION_STRING
    );

    // ***************** DELETE ALL EXISTING CONTAINERS ***************** 
    for await (const container of blobServiceClient.listContainers()) {
      const tempContainerClient = blobServiceClient.getContainerClient(container.name);

      const deleteContainerResponse = await tempContainerClient.delete();
      console.log(
        'Container was deleted successfully. requestId: ',
        deleteContainerResponse.requestId
      );


      // Display container name
      console.log(
        `\n\tname: ${container.name}\n\t`
      );
    }



    // ***************** CREATE CONTAINER ***************** 
    // Create a unique name for the container
    const containerName = 'quickstart' + uuidv1();

    console.log('\nCreating container...');
    console.log('\t', containerName);

    // Get a reference to a container
    const containerClient = blobServiceClient.getContainerClient(containerName);
    // Create the container
    const createContainerResponse = await containerClient.create();
    console.log(
      `Container was created successfully.\n\trequestId:${createContainerResponse.requestId}\n\tURL: ${containerClient.url}`
    );

    // ***************** CREATE BLOB ***************** 

    // Create a unique name for the blob
    const blobName = 'quickstart' + uuidv1() + '.txt';

    // Get a block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Display blob name and url
    console.log(
      `\nUploading to Azure storage as blob\n\tname: ${blobName}:\n\tURL: ${blockBlobClient.url}`
    );

    // Upload data to the blob
    const data = 'Hello, World!';
    const uploadBlobResponse = await blockBlobClient.upload(data, data.length);
    console.log(
      `Blob was uploaded successfully. requestId: ${uploadBlobResponse.requestId}`
    );

    // ***************** LIST BLOBS ***************** 
    console.log('\nListing blobs...');

    // List the blob(s) in the container.
    for await (const blob of containerClient.listBlobsFlat()) {
      // Get Blob Client from name, to get the URL
      const tempBlockBlobClient = containerClient.getBlockBlobClient(blob.name);

      // Display blob name and URL
      console.log(
        `\n\tname: ${blob.name}\n\tURL: ${tempBlockBlobClient.url}\n`
      );
    }

    // ***************** DOWNLOAD BLOB ***************** 
    // Get blob content from position 0 to the end
    // In Node.js, get downloaded data by accessing downloadBlockBlobResponse.readableStreamBody
    // In browsers, get downloaded data by accessing downloadBlockBlobResponse.blobBody
    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    console.log('\nDownloaded blob content...');
    console.log(
      '\t',
      await streamToText(downloadBlockBlobResponse.readableStreamBody)
    );


    // ***************** DOWNLOAD BLOB ***************** 
    // Delete container
    console.log('\nDeleting container...');

    const deleteContainerResponse = await containerClient.delete();
    console.log(
      'Container was deleted successfully. requestId: ',
      deleteContainerResponse.requestId
    );

  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

main()
  .then(() => console.log("Done"))
  .catch((ex) => console.log(ex.message));