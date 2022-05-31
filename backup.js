var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');

function templateMain(title, list, description, control){
  return `
    <!doctype html>
    <html>
    <head>
      <title>WEB1 - ${title}</title>
      <meta charset="utf-8">
    </head>
    <body>
      <h1><a href="/">WEB</a></h1>
      ${list}
      ${control}
      <h2>${title}</h2>
      <p>${description}</p>
    </body>
    </html>
  `;
}
function templateList(filelist){
  var list = '<ol>';
  var i=0;
  while(i < filelist.length){
    list = list + `<li><a href="?id=${filelist[i]}">${filelist[i]}</a></li>`;
    i = i + 1;
  }
  return list = list + `</ol>`;
}
var app = http.createServer(function(request,response){
  var _url = request.url;
  console.log('request.url:', request.url);
  var qdo = new URL('http://localhost:3000' + _url)
  var queryData = qdo.searchParams;
  var pathname = qdo.pathname;
  var title = queryData.get('id');
  console.log('title:', title)
  console.log('pathname:', pathname);

  if(_url.indexOf("/pictures/") == 0) // '/picture'로 시작하는 url을 요청했을 경우 이미지를 가져온다
  {
    var imgSrc = _url.substr(1); // 이미지 파일 이름 가져오기
    console.log(_url);
    console.log('imfscr:', imgSrc);
    fs.readFile(imgSrc, function(err, data){ // 이미지 파일을 읽어온다
      response.writeHead(200, {'Content-Type': 'image/jpeg'})
      response.end(data) // Send the file data to the browser.
    })
    return;
  }
  if(pathname === '/'){
    if(queryData.get('id') === null){
      fs.readdir('./data', function(error,filelist){
        console.log(filelist);
        title = 'welcome';
        var description = 'Hello noder'
        var list = templateList(filelist);
        var template = templateMain(title, list, description, '<a href="/create">create</a>');
        response.writeHead(200);
        response.end(template);
      })

    } else {
      fs.readdir('./data', function(error,filelist){
        var list = templateList(filelist);
        fs.readFile(`data/${queryData.get('id')}`, 'utf8', function(err, data){
          var description = data;
          //var list = templateList(filelist);
          var template = templateMain(title, list, description, '<a href="/create">create</a> <a href="/edit">edit</a>');
          response.writeHead(200);
          response.end(template);
        });
      });
    }
  } else if(pathname === '/create'){
    fs.readdir('./data', function(error,filelist){
      console.log(filelist);
      title = 'create';

      var list = templateList(filelist);
      var template = templateMain(title, list, `
        <form class="" action="http://localhost:3000/process_create" method="post">
        <p><input type="text" name="title" placeholder="제목"></p>
        <p>
          <textarea name="desc" rows="8" cols="60" placeholder="내용"></textarea>
        </p>
        <p><input type="submit"></p>
      </form>
  `);
      response.writeHead(200);
      response.end(template);
    });
  } else if(pathname === '/process_create'){
    var body = '';
    request.on('data', function (data) {
      body += data;
      if(body.length > 1e6){
        request.connection.destroy();
      }
    });
    request.on('end', function () {
      var post = new URLSearchParams(body);
      var title = post.get('title');
      var description = post.get('desc');
      if(description != null){
        console.log(title + '\n' + description);
        fs.writeFile(`data/${title}`, description, 'utf8', function(err){
          response.writeHead(302, {Location: `/?id=${title}`});
          response.end();
        });
      }
    });
  } else {
    response.writeHead(404);
    response.end('Page is not found');
  }
});
app.listen(3000);
