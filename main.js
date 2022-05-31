var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var path = require('path');
var sanitizeHtml = require('sanitize-html');

var templates = {
  Main:function (title, list, description, control){
    return `
      <!doctype html>
      <html>
      <head>
        <title>WEB1 - ${title}</title>
        <meta charset="utf-8">
        <style>
          #del {
            display:inline;
          }
        </style>
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
  },
  List:function (filelist){
    var list = '<ol>';
    var i=0;
    while(i < filelist.length){
      list = list + `<li><a href="/?id=${filelist[i]}">${filelist[i]}</a></li>`;
      i = i + 1;
    }
    list = list + `</ol>`;
    return list;
  }
}


var app = http.createServer(function(request,response){
  var _url = request.url;
  console.log('request.url:', request.url);
  var qdo = new URL('http://localhost:3000' + _url)
  var queryData = qdo.searchParams;
  var pathname = qdo.pathname;
  //var title = queryData.get('id');


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
        var list = templates.List(filelist);
        var template = templates.Main(title, list, description, '<a href="/create"><input type="button" value="create"></a>');
        response.writeHead(200);
        response.end(template);
      })

    } else {
      fs.readdir('./data', function(error,filelist){
        var filteredId = path.parse(queryData.get('id')).base;
        fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
          var title = sanitizeHtml(filteredId);
          var description = sanitizeHtml(description);
          var list = templates.List(filelist);
          //var list = templateList(filelist);
          var template = templates.Main(title, list, description, `
            <a href="/create"><input type="button" value="create"></a>
            <a href="/edit?id=${title}"><input type="button" value="edit"></a>
            <form id='del' action='process_delete' method='post' onsubmit="return confirm('정말 삭제합니까?');">
              <input type="hidden" name="id" value="${title}">
              <input type="submit" value="delete" >
            </form>
            `);
          response.writeHead(200);
          response.end(template);
        });
      });
    }
  } else if(pathname === '/create'){
    fs.readdir('./data', function(error,filelist){
      console.log(filelist);
      title = 'create';
      var list = templates.List(filelist);
      var template = templates.Main(title, list, `
        <form class="" action="/process_create" method="post">
        <p><input type="text" name="title" placeholder="제목"></p>
        <p>
          <textarea name="desc" rows="8" cols="60" placeholder="내용"></textarea>
        </p>
        <p><input type="submit"></p>
      </form>
  `,'');
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

      console.log(title + '\n' + description);
      fs.writeFile(`data/${title}`, description, 'utf8', function(err){
        response.writeHead(302, {Location: `/?id=${title}`});
        response.end();
      });

    });
  } else if(pathname === '/edit'){
    fs.readdir('./data', function(error,filelist){
      var filteredId = path.parse(queryData.get('id')).base;
      fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
        var title = filteredId;
        var list = templates.List(filelist);
        //var list = templateList(filelist);
        var template = templates.Main(title, list,
          `
          <form class="" action="/process_edit" method="post">
          <input type="hidden" name="id" value="${title}"
          <p><input type="text" name="title" value="${title}" placeholder="제목"></p>
          <p>
            <textarea name="desc" rows="8" cols="60" placeholder="내용">${description}</textarea>
          </p>
          <p><input type="submit"></p>
          </form>
          `,''
        );
        response.writeHead(200);
        response.end(template);
      });
    });
  } else if(pathname === '/process_edit'){
    var body = '';
    request.on('data', function (data) {
      body += data;
      if(body.length > 1e6){
        request.connection.destroy();
      }
    });
    request.on('end', function () {
      var post = new URLSearchParams(body);
      var id = post.get('id');
      var title = post.get('title');
      var description = post.get('desc');

      console.log(post);
      fs.rename(`data/${id}`, `data/${title}`, function(error){
        fs.writeFile(`data/${title}`, description, 'utf8', function(err){
          response.writeHead(302, {Location: `/?id=${title}`});
          response.end();
        });
      })


    });
  } else if(pathname === '/process_delete'){
    var body = '';
    request.on('data', function (data) {
      body += data;
      if(body.length > 1e6){
        request.connection.destroy();
      }
    });
    request.on('end', function () {
      var post = new URLSearchParams(body);
      var id = post.get('id');

      console.log(post);
      fs.unlink(`data/${id}`, function(error){
        response.writeHead(302, {Location: `/`});
        response.end();
      });
    });
  } else {
    response.writeHead(404);
    response.end('Page is not found');
  }
});
app.listen(3000);
