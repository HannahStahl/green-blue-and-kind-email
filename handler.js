const aws = require('aws-sdk')
const ses = new aws.SES()
const myEmail = process.env.email
const myDomain = process.env.domain

function generateResponse (code, payload) {
  return {
    statusCode: code,
    headers: {
      'Access-Control-Allow-Origin': myDomain,
      'Access-Control-Allow-Headers': 'x-requested-with',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(payload)
  }
}

function generateError (code, err) {
  return {
    statusCode: code,
    headers: {
      'Access-Control-Allow-Origin': myDomain,
      'Access-Control-Allow-Headers': 'x-requested-with',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(err.message)
  }
}

function generateEmailParams (body) {
  const { email, name, cart, message } = JSON.parse(body)
  if (!(email && name && cart && message)) {
    throw new Error('Missing parameters! Make sure to add parameters \'email\', \'name\', \'cart\', and \'message\'.')
  }
  let subject = 'New message from greenblueandkind.com';
  let html = '<html><body>';
  if (cart.items) {
    subject = 'New order request from greenblueandkind.com';
    html += `<h1><b>${name}</b> has submitted a request for the following items:</h1>`;
    html += `<table><thead><tr><td>Product</td><td>Size</td><td>Color</td><td>Quantity</td><td>Price</td></tr></thead><tbody>`;
    cart.items.forEach((item) => {
      html += `<tr><td>${item.name}</td><td>${item.size}</td><td>${item.color}</td><td>${item.quantity}</td><td>${item.price}</td></tr>`;
    });
    html += `</tbody></table><p><b>Estimated Total:</b> $${cart.total}</p>`;
    if (message.length > 0) {
      html += `<h2>Additional notes from ${name}</h2><p>"${message}"</p>`;
    }
    html += `<p><i>You can respond to this request by replying directly to this email.</i></p>`;
  } else {
    html += `<h1><b>${name}</b> has sent you a message:</h1><p>"${message}"</p>`;
    html += `<p><i>You can respond to this message by replying directly to this email.</i></p>`;
  }
  html += `</body></html>`;
  return {
    Source: myEmail,
    Destination: { ToAddresses: [myEmail] },
    ReplyToAddresses: [email],
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: html,
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject,
      }
    }
  }
}

module.exports.send = async (event) => {
  try {
    const emailParams = generateEmailParams(event.body)
    const data = await ses.sendEmail(emailParams).promise()
    return generateResponse(200, data)
  } catch (err) {
    return generateError(500, err)
  }
}
