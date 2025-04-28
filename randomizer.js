Qualtrics.SurveyEngine.addOnload(function() {

  /*
    This block randomizes the experimental treatment assignment
    (nationality, race, sentiment), selects a player from a roster,
    sets embedded data fields for later use, and then automatically
    advances to the next question.
    The entire block is invisible to the respondent, except for a loading spinner.
  */

  // --- Hide the question content (make the randomizer "invisible") ---
  this.getQuestionContainer().style.display = "none";

  // --- Show a simple loading spinner during randomization ---
  var spinner = document.createElement("div");
  spinner.setAttribute("id", "loadingSpinner");
  spinner.setAttribute("style", "border:8px solid #f3f3f3; border-top:8px solid #3498db; border-radius:50%; width:50px; height:50px; animation:spin 1s linear infinite; margin:50px auto;");
  document.body.appendChild(spinner);

  // --- Define simple CSS animation for the spinner ---
  var style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  // --- Setup: URLs for external files ---
  const playersUrl = "https://raw.githubusercontent.com/wpmarble/soccer-survey/main/player-list.csv";

  // --- Helper function to parse a CSV file into an array of objects ---
  function parseCSV(data) {
    const lines = data.trim().split("\n");
    const headers = lines[0].split(",");
    return lines.slice(1).map(line => {
      const values = line.split(",");
      const obj = {};
      headers.forEach((h, i) => {
        obj[h.trim()] = values[i] ? values[i].trim() : "";
      });
      return obj;
    });
  }

  // --- Helper function to select a random item from an array ---
  function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // --- Treatment randomization: British/Non-British × White/Non-White × Sentiment ---
  const tr_british = Math.round(Math.random());  // 0 = Non-British, 1 = British
  const tr_white = Math.round(Math.random());    // 0 = Non-White, 1 = White
  const sentiment_options = ["positive", "negative"]; // Update if using "neutral" too
  const tr_sentiment = randomChoice(sentiment_options);

  // --- Human-readable labels for treatments ---
  const tr_british_text = (tr_british === 1) ? "British" : "Non-British";
  const tr_white_text = (tr_white === 1) ? "White" : "Non-White";

  // --- Fetch player roster and select a player ---
  fetch(playersUrl)
    .then(response => response.text())
    .then(text => {
      const players = parseCSV(text);

      // --- Filter players to match randomized nationality and race ---
      const eligiblePlayers = players.filter(player => {
        const britishOk = (tr_british == 1) ? (player.british == "1") : (player.british == "0");
        const whiteOk = (tr_white == 1) ? (player.black_white == "White") : (player.black_white != "White");
        return britishOk && whiteOk;
      });

      // --- Randomly select a player (fallback to full list if needed) ---
      let selectedPlayer = (eligiblePlayers.length > 0) ? randomChoice(eligiblePlayers) : randomChoice(players);

      // --- Extract player attributes ---
      const fullName = selectedPlayer.name;           // e.g., "Marcus Rashford"
      const lastName = selectedPlayer.photo_name;     // e.g., "rashford" (for filenames)
      const teamName = selectedPlayer.team;
      const position = selectedPlayer.position;

      // --- Map detailed positions into broad categories ---
      let positionGroup = "";
      if (position == "GK") { positionGroup = "gk"; }
      else if (position == "DEF") { positionGroup = "def"; }
      else if (position == "MID") { positionGroup = "mid"; }
      else { positionGroup = "attack"; }

      // --- Set key Embedded Data fields for future use ---
      Qualtrics.SurveyEngine.setEmbeddedData('tr_british', tr_british);
      Qualtrics.SurveyEngine.setEmbeddedData('tr_white', tr_white);
      Qualtrics.SurveyEngine.setEmbeddedData('tr_sentiment', tr_sentiment);
      Qualtrics.SurveyEngine.setEmbeddedData('tr_british_text', tr_british_text);
      Qualtrics.SurveyEngine.setEmbeddedData('tr_white_text', tr_white_text);
      Qualtrics.SurveyEngine.setEmbeddedData('selected_player_name', fullName);
      Qualtrics.SurveyEngine.setEmbeddedData('selected_player_team', teamName);
      Qualtrics.SurveyEngine.setEmbeddedData('selected_player_photo_name', lastName);
      Qualtrics.SurveyEngine.setEmbeddedData('selected_player_position_group', positionGroup);

      // --- Setup Attention Check Options: 1 correct team + 3 distractors ---
      const allTeams = players.map(p => p.team).filter((team, index, self) => team && self.indexOf(team) === index);
      const distractorTeams = allTeams.filter(team => team !== teamName);
      const distractorChoices = [];
      while (distractorChoices.length < 3 && distractorTeams.length > 0) {
        const randomIndex = Math.floor(Math.random() * distractorTeams.length);
        distractorChoices.push(distractorTeams[randomIndex]);
        distractorTeams.splice(randomIndex, 1);
      }
      const allChoices = distractorChoices.concat([teamName]);
      shuffleArray(allChoices);
      const correctTeamIndex = allChoices.indexOf(teamName) + 1;

      // --- Set Attention Check Embedded Data ---
      Qualtrics.SurveyEngine.setEmbeddedData('Team1', allChoices[0]);
      Qualtrics.SurveyEngine.setEmbeddedData('Team2', allChoices[1]);
      Qualtrics.SurveyEngine.setEmbeddedData('Team3', allChoices[2]);
      Qualtrics.SurveyEngine.setEmbeddedData('Team4', allChoices[3]);
      Qualtrics.SurveyEngine.setEmbeddedData('CorrectTeamAnswer', correctTeamIndex);

      // --- Helper function to shuffle an array ---
      function shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var temp = array[i];
          array[i] = array[j];
          array[j] = temp;
        }
      }

      // --- Clean up: Remove spinner once randomization is finished ---
      var spinnerElement = document.getElementById('loadingSpinner');
      if (spinnerElement) { spinnerElement.remove(); }

      // --- Auto-advance to the next page ---
      this.clickNextButton();

    })
    .catch(error => {
      console.error("Failed to load players file:", error);
      alert("Error loading player data. Please refresh the page.");
    });

});