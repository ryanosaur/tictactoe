var FB = {};

FB.ref = new Firebase("https://tictactoe-ch.firebaseio.com/");
FB.gameRef = FB.ref.child("game");
FB.playersRef = FB.gameRef.child("players");
FB.gridRef = FB.gameRef.child("grid");
FB.turnRef = FB.gameRef.child("turn");

$(document).ready(function(){
  var clickedCell, currentMark, gridUpdate = {};

  $("button#Login").on("click", function(){
    FB.ref.authWithOAuthPopup("twitter", function(error, authData) {
      if (error) {
        console.log("Login Failed!", error);
      } else {
        console.log("Authenticated successfully with payload:", authData);
      }
    });
  });

  $(".cell").on("click", function() {
    currentMark = Game.currentMark();
    if (Game.yourTurn) {
      clickedCell = $(this).data('cell');
      console.log(clickedCell);
      gridUpdate = {};
      gridUpdate[clickedCell] = currentMark;
      FB.turnRef.({lastMark:currentMark});
      FB.gridRef.update(gridUpdate);
    }
  });
});

var Game = {};

Game.isCellEmpty(cell){
  return cell.text() === '';
}

Game.draw = function(clickedCell, currentMark){
  $('.cell[data-cell='+ clickedCell +']').text(currentMark).addClass(currentMark);
}

Game.yourTurn(){
  return Game.currentMark !== Game.lastMark();
}

Game.currentMark = function() {
  if (Game.x === Game.currentUsername) {
    return 'x';
  }
  if (Game.o === Game.currentUsername) {
    return 'o';
  }
  return null;
}

FB.playersRef.on("value", assignPlayers);
FB.gridRef.on("value", redrawGrid);
FB.turnRef.on("value", storeLastMark);

function assignPlayers(snap) {
  var players = snap.val();
  console.log("Snap Val:", players);
  if (!players) {
    return;
  }
  Game.players = players;
  Game.x = players.x;
  Game.o = players.o;

  for(var cell in game.grid){
    Game.draw(cell, game.grid[cell]);
  }

  $("#first-player").text(Game.players.x + " - X");
  $("#second-player").text(Game.players.o + " - O");
}

function redrawGrid(snap) {
  var grid = snap.val(), gridDiv = $('');
  $('.cell').removeClass('x o').text('');
  for(var key in grid){
    var mark = grid[key];
    $('.cell[data-cell='+ key +']').addClass(mark).text(mark);
  }
}

function storeLastMark(snap){
  Game.lastMark = snap.val().lastMark;
}

Game.nextPlayer = function() {
  console.log(this);
  if (!this.x) {
    return 'x';
  }
  if (!this.o) {
    return 'o';
  }
  return null;
}

var isNewUser = true;
FB.ref.onAuth(function(authData) {
  console.log("Auth:", authData);
  if (authData && isNewUser) {
    // save the user's profile into Firebase so we can list users,
    // use them in Security and Firebase Rules, and show profiles
    // ref.child("users").child(authData.uid).set({//nested children of root -- this is kind of schema setup.
    //   provider: authData.provider,
    //   name: getName(authData)
    // });
    FB.playersRef.once("value", function(snap) {
      assignPlayers(snap);
      Game.currentUsername = authData.twitter.username;
      var options = {}, nextPlayer = Game.nextPlayer();
      console.log(nextPlayer);
      if (nextPlayer) {
        options[nextPlayer] = Game.currentUsername;
        FB.playersRef.update(options);
      }
    });
  }
});

function getName(authData) {
  switch(authData.provider) {
     case 'password':
       return authData.password.email.replace(/@.*/, '');
     case 'twitter':
       return authData.twitter.displayName;
     case 'facebook':
       return authData.facebook.displayName;
  }
}
