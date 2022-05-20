var http = require('http');
var fs = require('fs');
var url = require('url');


var app = http.createServer(function(request,response){
var _url = request.url;
console.log(request.url);
var queryData = new URL('http://localhost:3000' + _url).searchParams;
var title = queryData.get('id');
console.log(queryData.get('id'));
if(_url == '/'){
  title = 'Welcome';
}
if(_url == '/favicon.ico'){
  response.writeHead(404);
  response.end();
  return;
}
if(_url.indexOf("/pictures/") == 0) // '/picture'로 시작하는 url을 요청했을 경우 이미지를 가져온다
{
  var imgSrc = _url.substr(1); // 이미지 파일 이름 가져오기
  console.log(imgSrc);
  fs.readFile(imgSrc, function(err, data){ // 이미지 파일을 읽어온다
    response.writeHead(200, {'Content-Type': 'image/jpeg'})
    response.end(data) // Send the file data to the browser.
  })
  return;
}
response.writeHead(200);
fs.readFile(`data/${queryData.get('id')}`, 'utf8', function(err, data){
  var description = data;
  var template = `
    <!doctype html>
    <html>
    <head>
      <title>WEB1 - ${title}</title>
      <meta charset="utf-8">
    </head>
    <body>
      <h1><a href="/">WEB</a></h1>
      <ol>
        <li><a href="?id=HTML">HTML</a></li>
        <li><a href="?id=CSS">CSS</a></li>
        <li><a href="?id=JavaScript">JavaScript</a></li>
      </ol>
      <h2>${title}</h2>
      <p>${description}</p>
    </body>
    </html>
  `;
  response.end(template);
});

//console.log(__dirname + url);


});
app.listen(3000);
