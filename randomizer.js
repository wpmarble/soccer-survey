// new with papa parse
Qualtrics.SurveyEngine.addOnload(function() {

  /*
    This block randomizes the experimental treatment assignment
    (nationality, race, sentiment), selects a player from a roster,
    sets embedded data fields for later use, and then automatically
    advances to the next question.
    The entire block is invisible to the respondent, except for a loading spinner.
  */

  // save question object
  var qThis = this; 

  // --- Hide the question content ---
  this.getQuestionContainer().style.display = "none";
  qThis.hideNextButton();

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
  const playersUrl = "https://wpmarble.github.io/soccer-survey/main/player-list.csv";

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
  const sentiment_options = ["positive", "negative"]; // Update if using "neutral" too
  const tr_sentiment = randomChoice(sentiment_options);
  console.log('tr_british: ', tr_british);
  console.log('tr_white: ', tr_white);
  console.log('tr_sentiment: ', tr_sentiment);

  // --- Human-readable labels for treatments ---
  const tr_british_text = (tr_british === 1) ? "British" : "Non-British";
  const tr_white_text = (tr_white === 1) ? "White" : "Non-White";

  // --- Load PapaParse dynamically ---
  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js';
  script.onload = function() {

    // --- Fetch and parse player roster ---
    Papa.parse(playersUrl, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const players = results.data;
        console.log('parsed players:\n', players);

        // --- Filter players to match randomized nationality and race ---
        const eligiblePlayers = players.filter(player => {
          const britishOk = (tr_british == 1) ? (player.british == "1") : (player.british == "0");
          const whiteOk = (tr_white == 1) ? (player.black_white == "White") : (player.black_white != "White");
          return britishOk && whiteOk;
        });
        console.log('eligiblePlayers:\n', eligiblePlayers);

        // --- Randomly select a player (fallback to full list if needed) ---
        let selectedPlayer = (eligiblePlayers.length > 0) ? randomChoice(eligiblePlayers) : randomChoice(players);
        console.log('selectedPlayer: ', selectedPlayer);

        // --- Extract player attributes ---
        const fullName = selectedPlayer.name;
        const lastName = selectedPlayer.photo_name;
        const teamName = selectedPlayer.team;
        const position = selectedPlayer.position;
        const ethnicity = selectedPlayer.ethnicity_display;
        const nation = selectedPlayer.nation;

        console.log('fullName: ', fullName);
        console.log('lastName: ', lastName);
        console.log('teamName: ', teamName);
        console.log('position: ', position);
        console.log('ethnicity: ', ethnicity);
        console.log('nation: ', nation);

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
        Qualtrics.SurveyEngine.setEmbeddedData('selected_player_ethnicity', ethnicity);
        Qualtrics.SurveyEngine.setEmbeddedData('selected_player_nationality', nation);

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
        console.log('attn check choices: ', allChoices);
        Qualtrics.SurveyEngine.setEmbeddedData('Team1', allChoices[0]);
        Qualtrics.SurveyEngine.setEmbeddedData('Team2', allChoices[1]);
        Qualtrics.SurveyEngine.setEmbeddedData('Team3', allChoices[2]);
        Qualtrics.SurveyEngine.setEmbeddedData('Team4', allChoices[3]);
        Qualtrics.SurveyEngine.setEmbeddedData('CorrectTeamAnswer', correctTeamIndex);

        // --- Clean up: Remove spinner once randomization is finished ---
        var spinnerElement = document.getElementById('loadingSpinner');
        if (spinnerElement) { spinnerElement.remove(); }

        // --- Auto-advance to the next page ---
        qThis.clickNextButton();
      },

      error: (error) => {
        console.error("PapaParse failed to load players file:", error);
        alert("Error loading player data. Please refresh the page.");
      }
    });

  };
  document.head.appendChild(script);

});