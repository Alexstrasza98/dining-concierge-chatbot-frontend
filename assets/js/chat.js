// TODO: switch from random number to uuid (can't figure out how to import in JS)
let sessionId = Math.floor(Math.random() * 1000)
let checkout = {};
let sessionState = {};
let requestAttributes = {};

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

function insertMessage(msg=null) {
  if (msg === null){
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
  }

  // Call ChatBotApi
  callChatbotApi(msg, sessionState)
      .then((response) => {
        console.log(response);
        let data = response.data;
        sessionState = data.sessionState;
        requestAttributes = data.requestAttributes;

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
                html = '<div class="card"><img src="' + message.unstructured.text.imageUrl + '"class="card-thumbnail" style="margin: 0 auto"/>'
                    + '<h2 class="card-title">' + message.unstructured.text.title + '</h2>'
                    + '<p class="card-text">' + message.unstructured.text.subtitle + '</p>';
                for (let button of message.unstructured.text.buttons) {
                  html += '<button onclick="insertMessage(\'' + button.value + '\')">' + button.text + '</button>'
                }
                html += '</div>';
                insertResponseMessage(html);
              }, 1100);
            } else {
              console.log('not implemented');
            }
          }
        } else {
          insertResponseMessage('Oops, something went wrong. Please try again.');
        }

        // if contains request attributes: it means one of two fulfillment of intents
        if(requestAttributes !== null) {
          // decode json string
          for(const key in requestAttributes){
            requestAttributes[key] = JSON.parse(requestAttributes[key])
          }

          // multiple restaurants choice card
          if(requestAttributes.hasOwnProperty("businesses")) {
            let html = ''
            html += '<section id="gallery"><div class="container"><div class="row">'

            for(let business of requestAttributes.businesses) {
              html += '<div class="col-lg-4 mb-4"><div class="card"><img class="card-img-top" src="' + business.image_url + '">'
              html += '<div class="card-body"><h5 class="card-title">' + business.name + '</h5>'
              html += '<h6 class="card-category">'
              for(let category of business.categories) {
                html += category.title + ', '
              }
              html += '</h6>'
              html += '<p>' + 'Rating: ' + business.rating + '/5 (' + business.review_count + ' reviews)</p>'
              html += '<p>' + 'Location: ' + business.location.display_address.join() + '</p>'
              html += '<p>' + 'Distance: ' + (business.distance / 1609).toFixed(2) + ' miles</p>'
              html += '<button style="display: block;margin:0 auto" onclick="insertMessage(\'' + business.alias + '\')">View more</button>'
              html += '</div></div></div>'
            }

            html += '</div></div></section>'
            html += '<section class="more-button"><button style="display: block;margin:0 auto" onclick="insertMessage(\'' + 'no' + '\')">More Restaurants</button></section>'

            insertResponseMessage(html)

          } else if(requestAttributes.hasOwnProperty("business_info")) { // single restaurant response card
            let business = requestAttributes.business_info
            let html = ''
            html += '<section id="restaurant_profile"><div class="container">'
            html += '<div class="profile"><img class="profile-img-top" src="' + business.image_url + '">'
            html += '<div class="card-body"><h3 class="card-title">' + business.name + '</h3>'
            html += '<h4 class="card-category">'
            for(let category of business.categories) {
              html += category.title + ', '
            }
            html += '</h4>'
            html += '<p>' + 'Rating: ' + business.rating + '/5 (' + business.review_count + ' reviews)</p>'
            html += '<p>' + 'Location: ' + business.location.display_address.join() + '</p>'
            html += '<p>' + 'Distance: ' + (business.distance / 1609).toFixed(2) + ' miles</p>'
            html += '<p>' + 'Phone: ' + business.display_phone + '</p>'
            html += '<p class="profile-photos">' + 'Photos: '
            for(let photo of business.photos) {
              html += '<img class="profile-photo" src="' + photo + '">'
            }
            html += '</p>'
            html += '<button onclick="' + business.url + '">View on Yelp</button>'
            if (business.hasOwnProperty("messaging")) {
              for(let messaging of business.messaging) {
                html += '<button onclick="' + messaging.url + '">' + messaging.use_case_text + '</button>'
              }
            }

            html += '<div>Reviews: '
            for(let review of requestAttributes.reviews_info.reviews) {
              html += '<p>' + review.text + '</p>'
            }
            html += '</div>'

            html += '</div></div></section>'

            html += '<button style="display: block;margin:0 auto" onclick="insertMessage(\'' + 'yes'+ '\')">This is the one!</button>'
            html += '<button style="display: block;margin:0 auto" onclick="insertMessage(\'' + 'no'+ '\')">I don\'t like this one.</button>'

            insertResponseMessage(html)
          }
        }

      })
      .catch((error) => {
        console.log('an error occurred', error);
        insertResponseMessage('Oops, something went wrong. Please try again.');
      });


}