Qualtrics.SurveyEngine.addOnload(function() {

  /*
    This block randomizes the experimental treatment assignment
    (nationality, race, sentiment), selects a player from a roster,
    sets embedded data fields for later use, and then automatically
    advances to the next question.
    The entire block is invisible to the respondent, except for a loading spinner.
  */

  var qThis = this; 

  // --- Hide the question content ---
  this.getQuestionContainer().style.display = "none";
  qThis.hideNextButton();
  qThis.hidePreviousButton();

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

  // --- Setup: URL for external JSON file ---
  const playersUrl = "https://williammarble.co/soccer-survey/player-list.json";

  // --- Helper function to shuffle an array ---
  function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }

  // --- Helper function to select a random item from an array ---
  function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // --- Treatment randomization: British/Non-British × White/Non-White × Sentiment ---
  const tr_british = Math.round(Math.random());  // 0 = Non-British, 1 = British
  const tr_white = Math.round(Math.random());    // 0 = Non-White, 1 = White
  const sentiment_options = ["positive", "negative"];
  const tr_sentiment = randomChoice(sentiment_options);

  console.log('tr_british: ', tr_british);
  console.log('tr_white: ', tr_white);
  console.log('tr_sentiment: ', tr_sentiment);

  const tr_british_text = (tr_british === 1) ? "British" : "Non-British";
  const tr_white_text = (tr_white === 1) ? "White" : "Non-White";

  // --- Fetch and use player roster ---
  fetch(playersUrl)
    .then(response => response.json())
    .then(players => {
      console.log('Fetched players:\n', players);

      // --- Filter players to match randomized nationality and race ---
      const eligiblePlayers = players.filter(player => {
        const britishOk = (tr_british == 1) ? (player.british == 1) : (player.british == 0);
        const whiteOk = (tr_white == 1) ? (player.black_white == "White") : (player.black_white != "White");
        return britishOk && whiteOk;
      });
      console.log('Eligible players:\n', eligiblePlayers);

      // --- Randomly select a player (fallback if necessary) ---
      let selectedPlayer = (eligiblePlayers.length > 0) ? randomChoice(eligiblePlayers) : randomChoice(players);
      console.log('Selected player: ', selectedPlayer);

      const fullName = selectedPlayer.name;
      const lastName = selectedPlayer.photo_name;
      const teamName = selectedPlayer.team;
      const position = selectedPlayer.position;
      const ethnicity = selectedPlayer.ethnicity_display;
      const nation = selectedPlayer.nation;

      // --- Map detailed positions into broad categories ---
      let positionGroup = "";
      if (position == "GK") { positionGroup = "gk"; }
      else if (position == "DEF") { positionGroup = "def"; }
      else if (position == "MID") { positionGroup = "mid"; }
      else { positionGroup = "attack"; }

      // --- Determine vignette template ---
      let vignetteTemplate = "";
      if (tr_sentiment === "negative" && selectedPlayer.takes_penalties == 1) {
        // Randomly choose between generic negative or penalty miss vignette
        vignetteTemplate = Math.random() < 0.5 ? positionGroup + "-negative.txt" : "pk-negative.txt";
      } else {
        vignetteTemplate = positionGroup + "-" + tr_sentiment + ".txt";
      }


      // --- Set Embedded Data ---
      Qualtrics.SurveyEngine.setEmbeddedData('tr_british', tr_british);
      Qualtrics.SurveyEngine.setEmbeddedData('tr_white', tr_white);
      Qualtrics.SurveyEngine.setEmbeddedData('tr_sentiment', tr_sentiment);
      Qualtrics.SurveyEngine.setEmbeddedData('tr_british_text', tr_british_text);
      Qualtrics.SurveyEngine.setEmbeddedData('tr_white_text', tr_white_text);
      Qualtrics.SurveyEngine.setEmbeddedData('selected_player_name', fullName);
      Qualtrics.SurveyEngine.setEmbeddedData('selected_player_team', teamName);
      Qualtrics.SurveyEngine.setEmbeddedData('selected_player_photo_name', lastName);
      Qualtrics.SurveyEngine.setEmbeddedData('selected_player_position_group', positionGroup);
      Qualtrics.SurveyEngine.setEmbeddedData('selected_player_ethnicity', ethnicity);
      Qualtrics.SurveyEngine.setEmbeddedData('selected_player_nationality', nation);
      Qualtrics.SurveyEngine.setEmbeddedData('vignetteTemplate', vignetteTemplate);

      // --- Setup Attention Check Options ---
      const allTeams = players
        .map(p => p.team)
        .filter(team => typeof team === 'string' && team.trim() !== '')
        .filter((team, index, self) => self.indexOf(team) === index);

      const distractorTeams = allTeams.filter(team => team !== teamName);
      const shuffledDistractors = distractorTeams.sort(() => 0.5 - Math.random());
      const distractorChoices = shuffledDistractors.slice(0, 3);

      const allChoices = [...distractorChoices, teamName].sort(() => 0.5 - Math.random());
      const correctTeamIndex = allChoices.indexOf(teamName) + 1;

      console.log('Attention check options:', allChoices);

      Qualtrics.SurveyEngine.setEmbeddedData('Team1', allChoices[0]);
      Qualtrics.SurveyEngine.setEmbeddedData('Team2', allChoices[1]);
      Qualtrics.SurveyEngine.setEmbeddedData('Team3', allChoices[2]);
      Qualtrics.SurveyEngine.setEmbeddedData('Team4', allChoices[3]);
      Qualtrics.SurveyEngine.setEmbeddedData('CorrectTeamAnswer', correctTeamIndex);

      // --- Clean up and advance ---
      var spinnerElement = document.getElementById('loadingSpinner');
      if (spinnerElement) { spinnerElement.remove(); }

      qThis.clickNextButton();
    })
    .catch(error => {
      console.error("Failed to load player JSON file:", error);
      alert("Error loading player data. Please refresh the page.");
    });

});