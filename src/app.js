// Chess Cinema - app.js

import { Chess } from 'chess.js';
import { Chessground } from 'chessground';
import { GAMES } from './games.js';
import './chessground.base.css';
import './chessground.brown.css';
import './chessground.cburnett.css';

var cg = null;
var chess = null;
var moves = [];
var moveIdx = 0;
var playTimer = null;
var isPlaying = false;
var currentGame = null;
var lastMove = null;

function parseMoves(pgn) {
  var tmp = new Chess();
  tmp.load_pgn(pgn);
  return tmp.history({ verbose: true });
}

function renderBoard() {
  cg.set({
    fen: chess.fen(),
    lastMove: lastMove ? [lastMove.from, lastMove.to] : undefined,
  });
}

function updateStatus() {
  if (!chess) return;
  var el = document.getElementById("status");
  if (moveIdx >= moves.length) {
    el.textContent = chess.in_checkmate() ? "Checkmate!" : (chess.in_draw() ? "Draw" : "Game over");
  } else if (isPlaying) {
    el.textContent = "Playing... move " + moveIdx + " / " + moves.length;
  } else {
    el.textContent = "Move " + moveIdx + " / " + moves.length + (chess.in_check() ? " (Check!)" : "");
  }
}

function addMoveChip(mv, idx) {
  var list = document.getElementById("move-list");
  var chip = document.createElement("span");
  chip.className = "move-chip" + (idx === moveIdx - 1 ? " active" : "");
  var moveNum = Math.floor(idx / 2) + 1;
  var prefix = idx % 2 === 0 ? moveNum + "." : moveNum + "...";
  chip.textContent = prefix + mv.san;
  chip.id = "chip-" + idx;
  list.appendChild(chip);
  chip.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function clearChipHighlights() {
  var chips = document.querySelectorAll(".move-chip.active");
  for (var i = 0; i < chips.length; i++) chips[i].classList.remove("active");
}

function stepForward() {
  if (moveIdx >= moves.length) return;
  var mv = moves[moveIdx];
  chess.move({ from: mv.from, to: mv.to, promotion: mv.promotion || "q" });
  lastMove = mv;
  moveIdx++;
  clearChipHighlights();
  addMoveChip(mv, moveIdx - 1);
  renderBoard();
  updateStatus();
  if (moveIdx >= moves.length) stopPlay();
}

function startPlay() {
  if (moveIdx >= moves.length) return;
  isPlaying = true;
  updatePlayBtn();
  updateStatus();
  playTimer = setInterval(function() {
    if (moveIdx >= moves.length) { stopPlay(); return; }
    stepForward();
  }, 1200);
}

function stopPlay() {
  isPlaying = false;
  if (playTimer) { clearInterval(playTimer); playTimer = null; }
  updatePlayBtn();
  updateStatus();
}

function updatePlayBtn() {
  var btn = document.getElementById("playBtn");
  if (moveIdx >= moves.length) {
    btn.textContent = "\u2714 Done";
    btn.disabled = true;
  } else if (isPlaying) {
    btn.textContent = "\u23F8 Pause";
    btn.disabled = false;
  } else {
    btn.textContent = "\u25B6 Play";
    btn.disabled = false;
  }
}

function resetGame() {
  chess = new Chess();
  moves = parseMoves(currentGame.pgn);
  moveIdx = 0;
  lastMove = null;
  document.getElementById("move-list").innerHTML = "";
  cg.set({
    fen: 'start',
    lastMove: undefined,
    turnColor: 'white',
  });
  stopPlay();
  updatePlayBtn();
  updateStatus();
}

function loadGame(g) {
  currentGame = g;
  document.getElementById("menu").style.display = "none";
  document.getElementById("game").style.display = "flex";
  document.getElementById("hdr-title").textContent = g.title;
  document.getElementById("hdr-players").textContent = g.white + " vs " + g.black + " \u00B7 " + g.event + " " + g.year;
  document.getElementById("hdr-desc").textContent = g.description;
  if (!cg) {
    cg = Chessground(document.getElementById("board"), {
      viewOnly: true,
      coordinates: true,
    });
  }
  resetGame();
}

function goMenu() {
  stopPlay();
  document.getElementById("game").style.display = "none";
  document.getElementById("menu").style.display = "block";
}

function buildMenu() {
  var container = document.getElementById("game-cards");
  container.innerHTML = "";
  for (var i = 0; i < GAMES.length; i++) {
    (function(g) {
      var btn = document.createElement("button");
      btn.className = "game-btn";
      btn.innerHTML = '<div class="title">' + g.title + '</div><div class="meta">' + g.white + " vs " + g.black + " \u00B7 " + g.event + " " + g.year + '</div>';
      btn.onclick = function() { loadGame(g); };
      container.appendChild(btn);
    })(GAMES[i]);
  }
}

window.addEventListener("load", function() {
  buildMenu();
  document.getElementById("playBtn").onclick = function() {
    if (isPlaying) stopPlay(); else startPlay();
  };
  document.getElementById("stepBtn").onclick = function() {
    stopPlay(); stepForward();
  };
  document.getElementById("resetBtn").onclick = function() {
    resetGame();
  };
  document.getElementById("backBtn").onclick = function() {
    goMenu();
  };
});
