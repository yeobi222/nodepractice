var a = function(){
  console.log('a');
}
function slowf(callback){
  callback();
}
console.log('1');
slowf(a);
console.log('2');
