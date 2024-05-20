const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/xss', (request, response) => {
  response.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>XSS anyone?</title>
      </head>
      <body>
        <script>${request.query.js}</script>
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})