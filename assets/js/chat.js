// TODO: switch from random number to uuid (can't figure out how to import in JS)
let sessionId = Math.floor(Math.random() * 1000)
let checkout = {};
let sessionState = {};
let requestAttributes = {};

$(document).ready(function() {
  let $messages = $('.messages-content'),
      d, h, m,
      i = 0;

  $(window).load(function() {
    $messages.mCustomScrollbar();
    insertResponseMessage('Hi there, I\'m your personal Concierge. How can I help?');
  });

  function updateScrollbar() {
    $messages.mCustomScrollbar("update").mCustomScrollbar('scrollTo', 'bottom', {
      scrollInertia: 10,
      timeout: 0
    });
  }

  function setDate() {
    d = new Date()
    if (m != d.getMinutes()) {
      m = d.getMinutes();
      $('<div class="timestamp">' + d.getHours() + ':' + m + '</div>').appendTo($('.message:last'));
    }
  }

  function callChatbotApi(message, sessionState) {
    console.log(sessionState)
    // params, body, additionalParams
    return sdk.chatbotPost({}, {
      messages: [{
        type: 'unstructured',
        unstructured: {
          text: message
        }
      }],
      sessionId: String(sessionId),
      sessionState: sessionState
    }, {});
  }

  function insertMessage() {
    // Capture user input
    msg = $('.message-input').val();
    if ($.trim(msg) == '') {
      return false;
    }

    // Display it into main chat window
    $('<div class="message message-personal">' + msg + '</div>').appendTo($('.mCSB_container')).addClass('new');
    setDate();

    // Clean user input butter
    $('.message-input').val(null);
    updateScrollbar();

    // Call ChatBotApi
    callChatbotApi(msg, sessionState)
      .then((response) => {
        console.log(response);
        let data = response.data;
        sessionState = data.sessionState
        requestAttributes = data.requestAttributes

        if (data.messages && data.messages.length > 0) {
          console.log('received ' + data.messages.length + ' messages');

          let messages = data.messages;

          // Analyze messages
          for (let message of messages) {
            if (message.unstructured.contentType === 'PlainText') {
              insertResponseMessage(message.unstructured.text);
            } else if (message.unstructured.contentType === 'ImageResponseCard') {

              // Construct an HTML object for this card
              let html = '';

              setTimeout(function() {
                html = '<div class="card"><img src="' + message.unstructured.text.imageUrl + '"gitclass="card-thumbnail" />'
                    + '<h2 class="card-title">' + message.unstructured.text.title + '</h2>'
                    + '<p class="card-text">' + message.unstructured.text.subtitle + '</p></div>'
                // + '<a href="#" onclick="' + message.structured.payload.clickAction + '()">' + message.structured.payload.buttonLabel + '</a>'
                ;
                insertResponseMessage(html);
              }, 1100);
            } else {
              console.log('not implemented');
            }
          }
        } else {
          insertResponseMessage('Oops, something went wrong. Please try again.');
        }
      })
      .catch((error) => {
        console.log('an error occurred', error);
        insertResponseMessage('Oops, something went wrong. Please try again.');
      });
  }

  $('.message-submit').click(function() {
    insertMessage();
  });

  $(window).on('keydown', function(e) {
    if (e.which == 13) {
      insertMessage();
      return false;
    }
  })

  function insertResponseMessage(content) {
    $('<div class="message loading new"><figure class="avatar"><img src="https://media.tenor.com/images/4c347ea7198af12fd0a66790515f958f/tenor.gif" /></figure><span></span></div>').appendTo($('.mCSB_container'));
    updateScrollbar();

    setTimeout(function() {
      $('.message.loading').remove();
      $('<div class="message new"><figure class="avatar"><img src="https://media.tenor.com/images/4c347ea7198af12fd0a66790515f958f/tenor.gif" /></figure>' + content + '</div>').appendTo($('.mCSB_container')).addClass('new');
      setDate();
      updateScrollbar();
      i++;
    }, 500);
  }

});
