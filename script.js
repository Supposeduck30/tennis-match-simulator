// Tennis Match Simulator - JavaScript Implementation

// Global variables for tracking match state
let matchResults = [];
let currentSetResults = [];

// Utility function to get random number between min and max
function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

// Calculate serve hold probability based on ranking
function serveHoldProb(rank) {
    return Math.max(0.5, 0.85 - (rank - 1) * 0.003);
}

// Generate random game score
function randomGameScore(serverWon, wentDeuce) {
    if (wentDeuce) {
        return "40 - 40";
    } else {
        const scores = ["40 - Love", "40 - 15", "40 - 30"];
        return scores[Math.floor(Math.random() * scores.length)];
    }
}

// Simulate a single game
function simulateGame(rankServer, rankReceiver) {
    const baseProb = serveHoldProb(rankServer);
    const serveProb = Math.max(0.45, Math.min(0.95, baseProb + randomFloat(-0.05, 0.05)));
    return Math.random() < serveProb;
}

// Play a tiebreak
function playTiebreak(rank1, rank2, player1, player2, startingServer) {
    let p1Points = 0, p2Points = 0;
    let server = startingServer;
    let pointNumber = 0;

    while (true) {
        const baseProb = server === 1 ? serveHoldProb(rank1) : serveHoldProb(rank2);
        
        // Tiebreak serve probability is closer to 60%, with small random variation
        let serveProb = baseProb - 0.08 + randomFloat(-0.04, 0.04);
        serveProb = Math.max(0.5, Math.min(0.65, serveProb));

        const pointWinner = Math.random() < serveProb ? 1 : 2;
        if (pointWinner === 1) {
            p1Points++;
        } else {
            p2Points++;
        }

        pointNumber++;

        // Switch server after first point, then every two points
        if (pointNumber === 1 || (pointNumber > 1 && pointNumber % 2 === 1)) {
            server = server === 1 ? 2 : 1;
        }

        // First to 7 with 2-point margin
        if ((p1Points >= 7 || p2Points >= 7) && Math.abs(p1Points - p2Points) >= 2) {
            break;
        }
    }

    return [p1Points, p2Points];
}

// Play a set
function playSet(rank1, rank2, startingGameNumber, player1, player2) {
    let p1Games = 0, p2Games = 0;
    let gameNumber = startingGameNumber;
    const setGames = [];

    while (true) {
        // Check for tiebreak at 6-6
        if (p1Games === 6 && p2Games === 6) {
            const tiebreakServer = gameNumber % 2 === 0 ? 1 : 2;
            const [p1TbPoints, p2TbPoints] = playTiebreak(rank1, rank2, player1, player2, tiebreakServer);

            if (p1TbPoints > p2TbPoints) {
                p1Games++;
            } else {
                p2Games++;
            }

            const tiebreakResult = `Set Final Score: ${player1} ${p1Games}(${p1TbPoints}) - ${p2Games}(${p2TbPoints}) ${player2}`;
            setGames.push({
                type: 'tiebreak',
                result: tiebreakResult,
                p1Games,
                p2Games
            });
            
            gameNumber++;
            break;
        }

        // Regular game
        const server = gameNumber % 2 === 0 ? 1 : 2;
        const serverName = server === 1 ? player1 : player2;
        const rankServer = server === 1 ? rank1 : rank2;
        const rankReceiver = server === 1 ? rank2 : rank1;

        // Add some randomness to server ranking
        const adjustedRankServer = Math.max(1, Math.min(1000, rankServer + randomFloat(-2, 2)));
        
        const serverWonGame = simulateGame(adjustedRankServer, rankReceiver);
        const wentDeuce = Math.random() < 0.25;
        const gameScoreStr = randomGameScore(serverWonGame, wentDeuce);

        if (serverWonGame) {
            if (server === 1) {
                p1Games++;
            } else {
                p2Games++;
            }
        } else {
            if (server === 1) {
                p2Games++;
            } else {
                p1Games++;
            }
        }

        const gameResult = `${player1} ${p1Games} - ${p2Games} ${player2} (${gameScoreStr}, Server: ${serverName})`;
        setGames.push({
            type: 'game',
            result: gameResult,
            p1Games,
            p2Games
        });

        gameNumber++;

        // Check for set win (6+ games with 2+ game advantage)
        if ((p1Games >= 6 || p2Games >= 6) && Math.abs(p1Games - p2Games) >= 2) {
            break;
        }
    }

    return [p1Games, p2Games, gameNumber, setGames];
}

// Main match simulation function
function simulateMatch(player1, rank1, player2, rank2) {
    matchResults = [];
    currentSetResults = [];
    
    // Display match header
    const matchHeader = document.getElementById('matchHeader');
    matchHeader.innerHTML = `🎾 ${player1} (Rank ${rank1}) vs ${player2} (Rank ${rank2})`;
    
    // Coin toss
    const firstServer = Math.random() < 0.5 ? 1 : 2;
    let totalGamesPlayed = firstServer === 1 ? 0 : 1;
    const coinToss = document.getElementById('coinToss');
    coinToss.innerHTML = `🪙 Coin Toss: ${firstServer === 1 ? player1 : player2} will serve first.`;
    
    let p1Sets = 0, p2Sets = 0;
    const setResults = [];
    
    // Play best of 3 sets
    while (p1Sets < 2 && p2Sets < 2) {
        const setNumber = setResults.length + 1;
        
        // Add set header to display
        const liveScore = document.getElementById('liveScore');
        const setHeader = document.createElement('div');
        setHeader.className = 'set-header';
        setHeader.innerHTML = `--- Set ${setNumber} ---`;
        liveScore.appendChild(setHeader);
        
        const [s1, s2, newTotalGames, setGames] = playSet(rank1, rank2, totalGamesPlayed, player1, player2);
        totalGamesPlayed = newTotalGames;
        
        setResults.push([s1, s2]);
        
        // Display games for this set in a clean format
        const gamesContainer = document.createElement('div');
        gamesContainer.className = 'games-container';
        
        setGames.forEach((game, index) => {
            const gameRow = document.createElement('div');
            gameRow.className = game.type === 'tiebreak' ? 'game-row tiebreak' : 'game-row';
            
            if (game.type === 'tiebreak') {
                // Format tiebreak result
                const parts = game.result.match(/Set Final Score: (.+) (\d+)\((\d+)\) - (\d+)\((\d+)\) (.+)/);
                if (parts) {
                    const [, p1Name, p1Games, p1TbPoints, p2Games, p2TbPoints, p2Name] = parts;
                    const tiebreakWinner = parseInt(p1TbPoints) > parseInt(p2TbPoints) ? p1Name : p2Name;
                    gameRow.innerHTML = `
                        <div class="game-left">
                            <div class="game-score">🏆 SET COMPLETE</div>
                            <div class="game-info">Tiebreak: ${p1TbPoints} - ${p2TbPoints}</div>
                        </div>
                        <div class="game-center">
                            <div class="game-winner">🎾 ${tiebreakWinner}</div>
                        </div>
                        <div class="game-right">
                            <div class="game-score">${p1Games} - ${p2Games}</div>
                            <div class="game-info">Final Set Score</div>
                        </div>
                    `;
                }
            } else {
                // Format regular game result and determine winner
                const parts = game.result.match(/(.+) (\d+) - (\d+) (.+) \((.+), Server: (.+)\)/);
                if (parts) {
                    const [, p1Name, p1Games, p2Games, p2Name, gameScore, serverName] = parts;
                    
                    // Determine who won this game by comparing with previous game
                    let gameWinner = '';
                    if (index === 0) {
                        // First game - winner is whoever has 1 game
                        gameWinner = parseInt(p1Games) > parseInt(p2Games) ? p1Name : p2Name;
                    } else {
                        // Compare with previous game to see who gained a game
                        const prevGame = setGames[index - 1];
                        const prevParts = prevGame.result.match(/(.+) (\d+) - (\d+) (.+) \((.+), Server: (.+)\)/);
                        if (prevParts) {
                            const [, , prevP1Games, prevP2Games] = prevParts;
                            const p1GamesInt = parseInt(p1Games);
                            const p2GamesInt = parseInt(p2Games);
                            const prevP1GamesInt = parseInt(prevP1Games);
                            const prevP2GamesInt = parseInt(prevP2Games);
                            
                            if (p1GamesInt > prevP1GamesInt) {
                                gameWinner = p1Name;
                            } else if (p2GamesInt > prevP2GamesInt) {
                                gameWinner = p2Name;
                            }
                        }
                    }
                    
                    gameRow.innerHTML = `
                        <div class="game-left">
                            <div class="game-score">${p1Games} - ${p2Games}</div>
                            <div class="game-info">Games in Set</div>
                        </div>
                        <div class="game-center">
                            <div class="game-winner">🎾 ${gameWinner}</div>
                        </div>
                        <div class="game-right">
                            <div class="game-score">${gameScore}</div>
                            <div class="server-info">Server: ${serverName}</div>
                        </div>
                    `;
                }
            }
            
            gamesContainer.appendChild(gameRow);
        });
        
        liveScore.appendChild(gamesContainer);
        
        if (s1 > s2) {
            p1Sets++;
        } else {
            p2Sets++;
        }
    }
    
    // Display final results
    const finalResults = document.getElementById('finalResults');
    
    let setScoresHTML = '<div class="set-scores"><h3>📋 Set Scores:</h3>';
    setResults.forEach((set, index) => {
        setScoresHTML += `<div class="set-score">Set ${index + 1}: ${player1} ${set[0]} - ${set[1]} ${player2}</div>`;
    });
    setScoresHTML += '</div>';
    
    const winner = p1Sets > p2Sets ? player1 : player2;
    const winnerHTML = `<div class="winner">🏆 Winner: ${winner}</div>`;
    
    finalResults.innerHTML = setScoresHTML + winnerHTML;
}

// Start simulation function
function startSimulation() {
    const player1Name = document.getElementById('player1Name').value.trim();
    const player1Rank = parseInt(document.getElementById('player1Rank').value);
    const player2Name = document.getElementById('player2Name').value.trim();
    const player2Rank = parseInt(document.getElementById('player2Rank').value);
    
    // Validation
    if (!player1Name || !player2Name) {
        alert('Please enter both player names.');
        return;
    }
    
    if (!player1Rank || !player2Rank || player1Rank < 1 || player1Rank > 1000 || player2Rank < 1 || player2Rank > 1000) {
        alert('Please enter valid rankings (1-1000) for both players.');
        return;
    }
    
    // Clear previous results
    const liveScore = document.getElementById('liveScore');
    const finalResults = document.getElementById('finalResults');
    liveScore.innerHTML = '';
    finalResults.innerHTML = '';
    
    // Show results section
    const resultsSection = document.getElementById('results');
    resultsSection.classList.add('show');
    
    // Disable button during simulation
    const simulateBtn = document.getElementById('simulateBtn');
    simulateBtn.disabled = true;
    simulateBtn.textContent = 'Simulating...';
    
    // Add small delay for better UX
    setTimeout(() => {
        simulateMatch(player1Name, player1Rank, player2Name, player2Rank);
        
        // Re-enable button
        simulateBtn.disabled = false;
        simulateBtn.textContent = 'Simulate Match';
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }, 500);
}

// Add enter key support for inputs
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                startSimulation();
            }
        });
    });
});
