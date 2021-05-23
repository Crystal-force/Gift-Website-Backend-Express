const e = require("express");
var postmark = require("postmark");
var client = new postmark.ServerClient("504411ec-5369-4383-8310-d83db7bd44c7");
var { firestore } = require('../firebase/firebase')

exports.sendMail = async (req, res) => {
  let { email } = req.body
  let digits = Math.floor(Math.random() * 90000) + 10000;
  const emailRef = firestore.collection('authentication');
  const snapshot = await emailRef.where('email', '==', email).get();
  if (snapshot.empty) {
    let { id } = await emailRef.add({
      email, digits
    });
  } else {
    snapshot.forEach(async doc => {
      await emailRef.doc(doc.id).set({
        email, digits
      })
    });
  }
  await client.sendEmail({
    "From": "hello@gift2gift.me",
    "To": email,
    "Subject": "Hello from Postmark",
    "HtmlBody": `<strong>Hello</strong> dear Postmark user.\n Verification code:${digits}`,
    "TextBody": "Hello from Postmark!",
    "MessageStream": "outbound"
  });
  res.sendStatus(200)
}

exports.checkAuthentication = async (req, res) => {
  let { email, authenticateCode } = req.body
  const emailRef = firestore.collection('authentication');
  const snapshot = await emailRef.where('email', '==', email).get();
  let result = false;
  if (!snapshot.empty) {
    snapshot.forEach(async doc => {
      if (doc.data().digits === Number(authenticateCode)) result = true;
    });
  }
  console.log(result, authenticateCode, email);
  res.send(result)
}

exports.sendInvite = async (req, res) => {
  try {
    let { templateId, to, userName, toUserEmail, toUserName, action_url } = req.body
    await client.sendEmailWithTemplate({
      To: `${userName}<${to}>`,
      From: "hello@gift2gift.me",
      TemplateId: Number(templateId),
      TemplateModel: {
        from_name: userName,
        to_name: toUserName,
        action_url: action_url
      }

    });
    res.send(true)
  } catch (error) {
    console.log(error)
    res.send(false)
  }
}

exports.sendGiftMail = async (req, res) => {
  try {
    let { to, body } = req.body
    await client.sendEmail({
      "From": "hello@gift2gift.me",
      "To": to,
      "Subject": "Gift2Gift",
      "HtmlBody": body,
      "TextBody": "Hello from Gift2Gift!",
      "MessageStream": "outbound"
    });
    res.sendStatus(200)
  } catch (error) {
    console.log(error);
    res.sendStatus(422)
  }
}