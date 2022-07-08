const express = require("express");
var request = require("request");
const app = express();
const port = 3000;
var bodyParser = require("body-parser");

// app.use(cors());
// Configuring body parser middleware
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// app.post("/session/nightwatch/findElementAndClick", (req, res) => {
//   // console.log(JSON.parse(req.body))
//   let sessionId = req.body.sessionId;
//   let value = req.body.value;
//   let using = req.body.using;

//   let ip = "10.20.4.86:4444";
//   const uri = `http://${ip}/session/${sessionId}/element`;

//   let elementId = "";

//   request(
//     {
//       url: uri,
//       method: "POST",
//       json: true, // <--Very important!!!
//       body: { value, using },
//       headers: {
//         Accept: "application/json",
//         "Content-Type": "application/json; charset=utf-8",
//       },
//     },
//     function (error, response, body) {
//       console.log(body);

//       elementId = Object.values(body.value)[0];
//       console.log("elementId", elementId);

//       next_uri = `${uri}/${elementId}/click`;

//       request(
//         {
//           url: next_uri,
//           method: "POST",
//           json: true, // <--Very important!!!
//           body: { id: elementId },
//           headers: {
//             Accept: "application/json",
//             "Content-Type": "application/json; charset=utf-8",
//           },
//         },
//         function (error, response, body) {
//           console.log(body);
//         }
//       );
//     }
//   );
//   res.send("Hello World!");
// });


app.all("*", function (req, res) {
  let ip = "10.20.4.86:4444";
  if (req.path.includes("nightwatch") && req.method == "POST") {
    // console.log(JSON.parse(req.body))
    let sessionId = req.body.sessionId;
    let value = req.body.selector;
    let using = req.body.using;

    const uri = `http://${ip}/session/${sessionId}/element`;

    let elementId;

    let count = 0;
    function findelemWrapper(value, using, sessionId) {
        request(
            {
                url: uri,
                method: "POST",
                json: true, // <--Very important!!!
                body: { value, using },
                headers: {
                Accept: "application/json",
                "Content-Type": "application/json; charset=utf-8",
                },
            },
            function (error, response, body) {

                if(body.value.error) {
                    if(count < 5) {
                        count++;
                        console.log("count", count);
                        setTimeout(() => findelemWrapper(value, using, sessionId), 1000);
                        return; 
                    } else {
                        console.log("Retries count", count);
                        count = 0;
                    }
                }

                elementId = Object.values(body.value)[0];
        
                next_uri = `${uri}/${elementId}/click`;
                
                if(body.value.error)
                clickWrapper(elementId, next_uri, body.value);
            }
        );
    }

    function clickWrapper(elementId, next_uri, body) {
        request(
            {
              url: next_uri,
              method: "POST",
              json: true, // <--Very important!!!
              body: { id: elementId },
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json; charset=utf-8",
              },
            },
            function (error, response, body) {
                
             if(body.error) {
                res.status(400);
                res.send(body.error);
             } else {
                 res.send(body)
             }
            }
          );
    }


    findelemWrapper(value, using, sessionId);
  } else {
    const requestOptions = {
        url: `http://${ip}${req.path}`,
        method: req.method,
        headers: req.headers
    }

    if (req.method === 'POST') {
        Object.assign(requestOptions, {
            json: true, // <--Very important!!!
            body: req.body
        })
    }

    request(requestOptions,
      function (error, response, body) {
        res.send(body)
      }
    );
  }
});

app.listen(port, "0.0.0.0" ,() => {
  console.log(`Example app listening on port ${port}`);
});
