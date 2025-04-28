/*
This javascript constructs the vignette treatment. Make sure that
the following html is in the question:
<div id="vignette">
  <!-- your vignette text and image go here -->
</div>
<br>
<p id="continueMessage" style="display:none; color:gray; text-align:right;">You may now continue.</p>
*/

Qualtrics.SurveyEngine.addOnload(function() {
  // URLs for player list, player photos, and vignette templates
  const playersUrl = "https://raw.githubusercontent.com/wpmarble/soccer-survey/main/player-list.csv";
  const photoDirUrl = "https://raw.githubusercontent.com/wpmarble/soccer-survey/main/photos";
  const vignetteDirUrl = "https://raw.githubusercontent.com/wpmarble/soccer-survey/main/vignettes";

  // Function to parse CSV text into an array of player objects
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

  // Helper function to randomly select an item from an array
  function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Randomly assign treatment groups: nationality, race, and sentiment
  const tr_british = Math.round(Math.random()); // 0 = non-British, 1 = British
  const tr_white = Math.round(Math.random());   // 0 = non-White, 1 = White
  const sentiment_options = ["positive", "negative", "neutral"];
  const tr_sentiment = randomChoice(sentiment_options); // Randomly pick sentiment

  // create human-readable versions of race X nationality
  const tr_british_text = (tr_british === 1) ? "British" : "Non-British";
  const tr_white_text = (tr_white === 1) ? "White" : "Non-White";

  // Set Embedded Data for the text versions
  Qualtrics.SurveyEngine.setEmbeddedData('tr_british_text', tr_british_text);
  Qualtrics.SurveyEngine.setEmbeddedData('tr_white_text', tr_white_text);

  // Load player list
  fetch(playersUrl)
    .then(response => response.text())
    .then(text => {
      // Parse players
      const players = parseCSV(text);
      console.log("players:\n", players);

      // Filter players matching treatment group
      const eligiblePlayers = players.filter(player => {
        const britishOk = (tr_british == 1) ? (player.british == "1") : (player.british == "0");
        const whiteOk = (tr_white == 1) ? (player.black_white == "White") : (player.black_white != "White");
        return britishOk && whiteOk;
      });

      let selectedPlayer;

      // Randomly select from eligible players, or fallback to any player
      if (eligiblePlayers.length > 0) {
        selectedPlayer = randomChoice(eligiblePlayers);
      } else {
        console.warn("No eligible players for assigned treatment. Randomly selecting from all players instead.");
        selectedPlayer = randomChoice(players);
      }

      

      // Extract player information
      const fullName = selectedPlayer.name;
      const lastName = selectedPlayer.photo_name;
      const teamName = selectedPlayer.team;
      const position = selectedPlayer.position;

      // Map detailed position (GK, DEF, MID, etc.) to broad categories
      let positionGroup = "";
      if (position == "GK") {
        positionGroup = "gk";
      } else if (position == "DEF") {
        positionGroup = "def";
      } else if (position == "MID") {
        positionGroup = "mid";
      } else {
        positionGroup = "attack"; // Assume attacker otherwise
      }
    
      // Build photo filename and URL
      const photoFilename = lastName.toLowerCase() + "-" + tr_sentiment + ".jpg";
      const photoUrl = photoDirUrl + "/" + photoFilename;

      // Build vignette filename and URL
      const vignetteFilename = positionGroup + "-" + tr_sentiment + ".txt";
      const vignetteUrl = vignetteDirUrl + "/" + vignetteFilename;


      // START(Attention Check Setup)
      // Pull random teams + correct team
      // First, build a list of all team names from the players array
      const allTeams = players.map(player => player.team).filter((team, index, self) => {
        return team && self.indexOf(team) === index; // Remove blanks and duplicates
      });

      // Remove the correct team from the list temporarily
      const distractorTeams = allTeams.filter(team => team !== teamName);

      // Randomly pick 3 distractor teams
      const distractorChoices = [];
      while (distractorChoices.length < 3 && distractorTeams.length > 0) {
        const randomIndex = Math.floor(Math.random() * distractorTeams.length);
        distractorChoices.push(distractorTeams[randomIndex]);
        distractorTeams.splice(randomIndex, 1); // Remove selected to avoid duplicates
      }

      // Add the correct team to the choices
      const allChoices = distractorChoices.concat([teamName]);

      // Shuffle all 4 choices randomly
      function shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var temp = array[i];
          array[i] = array[j];
          array[j] = temp;
        }
      }
      shuffleArray(allChoices);

      // Find which index the correct team ended up at (1-based for Qualtrics)
      const correctTeamIndex = allChoices.indexOf(teamName) + 1;


      // Set embedded data for each team choice
      Qualtrics.SurveyEngine.setEmbeddedData('Team1', allChoices[0]);
      Qualtrics.SurveyEngine.setEmbeddedData('Team2', allChoices[1]);
      Qualtrics.SurveyEngine.setEmbeddedData('Team3', allChoices[2]);
      Qualtrics.SurveyEngine.setEmbeddedData('Team4', allChoices[3]);
      Qualtrics.SurveyEngine.setEmbeddedData('CorrectTeamAnswer', correctTeamIndex);
      // END(Attention Check)


      // Fetch vignette text
      fetch(vignetteUrl)
        .then(response => response.text())
        .then(vignetteTemplate => {
          // Replace placeholder tags in the vignette template
          const vignetteText = vignetteTemplate
            .replace(/\[player name\]/gi, fullName) // Case-insensitive replace
            .replace(/\[club name\]/gi, teamName);

          // Save customized vignette to Embedded Data
          Qualtrics.SurveyEngine.setEmbeddedData('vignette_text', vignetteText);

          // Optionally display the vignette and photo immediately on the page
          const vignetteDiv = document.getElementById('vignette');
          if (vignetteDiv) {
            vignetteDiv.innerHTML = 
              '<div style="text-align:left; padding:10px;">' +
              '<img src="' + photoUrl + 
              '" alt="Player photo" style="max-width:80%; height:auto; display:block; margin:10px auto 0 auto;">' +
              '<br>' +
              vignetteText +
              '</div>';          
            }
          console.log("vignetteText:", vignetteText);
        })
        .catch(error => {
          console.error("Failed to load vignette file:", error);
        });


      // hide "next" button for 20 seconds
      // include this html element in the question:
      // <p id="continueMessage" style="display:none; color:gray; text-align:center;">You may now continue.</p>
      this.hideNextButton();
      setTimeout(() => {
        this.showNextButton();
        var msg = document.getElementById('continueMessage');
        if (msg) { msg.style.display = 'block'; }
      }, 15000);

      // Log variables
      console.log("tr_british: ", tr_british)
      console.log("tr_white: ", tr_white)
      console.log("tr_sentiment: ", tr_sentiment)
      console.log("positionGroup:\n", positionGroup);
      console.log("tr_sentiment:\n", tr_sentiment);
      console.log("selectedPlayer:\n", selectedPlayer);
      console.log("lastName: ", lastName)
      console.log("photoFilename: ", photoFilename);
      console.log("photoUrl: ", photoUrl);

      console.log("fullName:\n", fullName);
      console.log("positionGroup:\n", positionGroup);
      console.log("vignetteDirUrl:\n", vignetteDirUrl);
      console.log("vignetteFilename:\n", vignetteFilename);
      console.log("vignetteFilename:", vignetteFilename);
      console.log("vignetteUrl:", vignetteUrl);

      console.log("Team1: ", allChoices[0]);
      console.log("Team2: ", allChoices[1]);
      console.log("Team3: ", allChoices[2]);
      console.log("Team4: ", allChoices[3]);
      console.log("CorrectTeamAnswer: ", correctTeamIndex);



      // Save player attributes and treatment assignment to Embedded Data
      Qualtrics.SurveyEngine.setEmbeddedData('tr_british', tr_british);
      Qualtrics.SurveyEngine.setEmbeddedData('tr_white', tr_white);
      Qualtrics.SurveyEngine.setEmbeddedData('tr_sentiment', tr_sentiment);
      Qualtrics.SurveyEngine.setEmbeddedData('selected_player_name', fullName);
    })
    .catch(error => {
      console.error("Failed to load players file:", error);
    });

});