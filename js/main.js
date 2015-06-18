var FB = {};

var ref = new Firebase("https://tictactoe-ch.firebaseio.com/");
var FB.gameRef = ref.child("game");
FB.gridRef = ref.child('grid');

$(document).ready(function(){
  $("button#Login").on("click", function(){
    ref.authWithOAuthPopup("twitter", function(error, authData) {
      if (error) {
        console.log("Login Failed!", error);
      } else {
        console.log("Authenticated successfully with payload:", authData);
      }
    });
  });

  $(".cell").on("click", function() {
    var currentMark = Game.currentMark();
    if (currentMark) {
      $(this).addClass(currentMark).text(currentMark);
    }
  });
});

var Game = {};

Game.currentMark = function() {
  if (Game.x === Game.currentUsername) {
    return 'x';
  }
  if (Game.o === Game.currentUsername) {
    return 'o';
  }
  return null;
}

// { gc1: 'x', gc2: 'o' ... }

gameRef.on("value", assignPlayers);

function assignPlayers(snap) {
  var game = snap.val();
  console.log("Snap Val:", game);
  if (!game) {
    return;
  }
  Game.players = game.players;
  Game.x = game.players.x;
  Game.o = game.players.o;

  $("#first-player").text(Game.players.x + " - X");
  $("#second-player").text(Game.players.o + " - O");
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
ref.onAuth(function(authData) {
  console.log("Auth:", authData);
  if (authData && isNewUser) {
    // save the user's profile into Firebase so we can list users,
    // use them in Security and Firebase Rules, and show profiles
    // ref.child("users").child(authData.uid).set({//nested children of root -- this is kind of schema setup.
    //   provider: authData.provider,
    //   name: getName(authData)
    // });
    gameRef.once("value", function(snap) {
      assignPlayers(snap);
      Game.currentUsername = authData.twitter.username;
      var options = {}, nextPlayer = Game.nextPlayer();
      console.log(nextPlayer);
      if (nextPlayer) {
        options[nextPlayer] = Game.currentUsername;
        gameRef.child("players").update(options);
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
