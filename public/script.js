// Enable strict mode for better JavaScript quality
'use strict';

// Bind the document.querySelector function to a shorter variable name for easier use
const $ = document.querySelector.bind(document);

// Add event listeners to the bot icon and close button to open and close the dialog box
$('#bot-icon').addEventListener('click', openDialogBox);
$('#close-btn').addEventListener('click', closeDialogBox);

// Define the function to open the dialog box and hide the bot icon
function openDialogBox() {
  $('#bot-icon').classList.add('hidden');
  $('#dialogbox').classList.remove('hidden');
}

// Define the function to close the dialog box and show the bot icon
function closeDialogBox() {
  $('#bot-icon').classList.remove('hidden');
  $('#dialogbox').classList.add('hidden');
}

// Add an event listener to the chat input field to send a message when Enter is pressed
$('#chat-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// Add an event listener to the send button to send a message when clicked
$('#send-btn').addEventListener('click', sendMessage);

// Define the function to send a message to the dialog box
function sendMessage() {
  // Get the message text from the chat input field and trim it
  const message = $('#chat-input').value.trim();
  // If the message is not empty, add it to the dialog box, clear the chat input field, and process the message
  if (message !== "") {
    addMessageToDialogBox(message, true);
    $('#chat-input').value = "";
    processMessage(message);
  }
}

// Define the function to add a message to the dialog box
function addMessageToDialogBox(message, isUser) {
  // Determine the class of the message (user message or bot message)
  const messageClass = isUser ? 'user-message' : 'bot-message';

  // Get the dialog box messages element and create a new div element for the message
  const dialogboxMessages = $('#dialogbox-messages');
  const dialogboxMessage = document.createElement('div');

  // Add the appropriate classes and text content to the message element
  dialogboxMessage.classList.add('dialogbox-message', messageClass);
  dialogboxMessage.textContent = message;
  dialogboxMessage.style.margin = '10px';

  // Add the message element to the dialog box messages element and scroll to the bottom of the dialog box
  dialogboxMessages.appendChild(dialogboxMessage);
  dialogboxMessages.scrollTop = dialogboxMessages.scrollHeight;
}

// Define the function to process a message and generate a response
function processMessage(message) {
  // Define a list of keywords to search for in the message
  const keywords = [
    "hello","hi","hey","greetings","how","are","you",
    "search","for","get","find","file","give","me","download","this",
    "bye","thanks"
  ];
  // Initialize a variable to hold the first keyword found in the message (if any)
  let foundKeyword = "";
  // Loop through each keyword and check if it is in the message (ignoring case)
  for (const keyword of keywords) {
    if (message.toLowerCase().includes(keyword)) {
      foundKeyword = keyword;
      break;
    }
  }
  // A switch statement that checks the value of the variable "foundKeyword" and executes the corresponding case.
  switch (foundKeyword) {
    // If the value of "foundKeyword" is an empty string, add a message to the dialog box saying that the input wasn't understood.
    case "":
      addMessageToDialogBox("I'm sorry, I didn't understand that.");
      break;
    // If the value of "foundKeyword" is one of the following, add a greeting message to the dialog box.
    case "hello":
    case "hi":
    case "hey":
    case "greetings":
    case "how":
    case "are":
    case "you":
      addMessageToDialogBox('Hello there! How can I assist you today?');
      break;
    // If the value of "foundKeyword" is one of the following, execute the "searchForFiles" function.
    case "search":
    case "for":
    case "get":
    case "find":
    case "file":
    case "give":
    case "me":
    case "download": 
    case "this": 
      searchForFiles(message);
      break;
      // If the value of "foundKeyword" is one of the following, add a goodbye message to the dialog box.
    case "bye":
    case "thanks":
      addMessageToDialogBox("It was nice helping you.\nGoodBye! Have a nice day.");
      break;
    // If the value of "foundKeyword" is not any of the above cases, add a message to the dialog box saying that the system does not know how to help with that.
    default:
      addMessageToDialogBox("I'm sorry, I don't know how to help with that.");
  }

  // A function that takes in a "message" parameter and searches for files based on the message.
  function searchForFiles(message) {
    // Replace any occurrences of the keywords in the message with an empty string and trim any extra spaces.
    const query = message.replace(/(search|for|get|find|file|give|me|download|this)/gi, "").trim();
    // If the resulting query string is not empty, fetch the files that match the query string and add them to the dialog box.
    fetch(`/fileSearch?q=${query}`)
      .then((response) => response.json())
      .then((data) => {
        // If the response data is not an array or the array is empty, add a message to the dialog box saying that no results were found for the query.
        if (!Array.isArray(data) || data.length === 0) {
          addMessageToDialogBox(`Sorry, no results found for '${query}'.`);
        }
        // If the array is not empty, add a message to the dialog box saying how many results were found and list the file names as clickable links that lead to their download.
        else {
          addMessageToDialogBox(`Found ${data.length} result(s) for '${query}' & downloading...`);
          for (const file of data) {
            const filepath = `/download/${file.path}`;
            downloadFile(filepath, file.filename);
          }
        }
      })
      .catch((error) => {
        console.error(error);
        // If an error occurred while searching for files, add a message to the dialog box saying that there was an error.
        addMessageToDialogBox("Sorry, an error occurred while searching for files.");
      });
  }
}

//Function downloads a file from a URL and saves it with a specified filename
function downloadFile(fileUrl, fileName) {
  // Use the Fetch API to retrieve the file from the specified URL
  fetch(fileUrl)
    .then(response => response.blob()) // Convert the response to a Blob object
    .then(blob => {
      // Create a URL for the Blob object using the createObjectURL() method
      const url = window.URL.createObjectURL(new Blob([blob]));

      // Create a new <a> element to initiate the download
      const link = document.createElement('a');
      link.href = url; // Set the download URL as the href attribute of the <a> element
      link.setAttribute('download', fileName); // Set the filename as the download attribute of the <a> element

      // Append the <a> element to the document body
      document.body.appendChild(link);

      // Programmatically click the <a> element to initiate the download
      link.click();

      // Remove the <a> element from the document after the download is complete
      link.parentNode.removeChild(link);
    })
    .catch(error => console.error(error)); // Handle any errors that occur during the download process
}
