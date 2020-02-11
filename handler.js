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
  const { email, name, message } = JSON.parse(body)
  if (!(email && name && message)) {
    throw new Error('Missing parameters! Make sure to add parameters \'email\', \'name\', \'message\'.')
  }
  return {
    Source: myEmail,
    Destination: { ToAddresses: [myEmail] },
    ReplyToAddresses: [email],
    Message: {
      Body: {
        Text: {
          Charset: 'UTF-8',
          Data: `${name} says:\n\n"${message}"\n\nYou can reply directly to this email.`
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: 'New message from greenblueandkind.com'
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
