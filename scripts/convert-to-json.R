library(jsonlite)
library(dplyr)

setwd("~/Dropbox/Fantasy_PL/survey/public-survey-files/")
dat <- read.csv("player-list.csv")
toJSON(dat, pretty = TRUE) %>% 
  cat(file = "player-list.json")

