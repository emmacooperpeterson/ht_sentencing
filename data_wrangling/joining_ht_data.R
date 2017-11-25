library(tidyverse)
library(lubridate)

setwd('~/Desktop/repos/ht_sentencing/data_wrangling/')

#################
### LOAD DATA ###
#################

#load
cases <- read_csv("../original_data/cases.csv")
defendants <- read_csv("../original_data/defendants.csv")
judges <- read_csv("../original_data/judges.csv")
crime_locations <- read_csv("../original_data/crime_locations.csv")

#subset
cases <- cases[c('case_id', 'start_date', 'minor_sex', 'adult_sex', 'labor', 'recruit1', 'number_victims_female', 'number_victims_male', 'number_victims_foreign')]
defendants <- defendants[c('case_id', 'judge_id', 'gender', 'race', 'total_sentence', 'first_name')]
judges <- judges[c('id', 'gender', 'race', 'appointed_by')]
crime_locations <- crime_locations[c('case_id', 'state')]

#rename
colnames(cases) <- c('case_id', 'year', 'minor_sex', 'adult_sex', 'labor', 'recruit', 'female_vics', 'male_vics', 'foreign_vics')
colnames(defendants) <- c('case_id', 'judge_id', 'def_gender', 'def_race', 'sentence', 'first_name')
colnames(judges) <- c('judge_id', 'judge_gender', 'judge_race', 'appointed_by')
colnames(crime_locations) <- c('case_id', 'region')
colnames(victim_countries) <- c('case_id', 'victim_country')

################
### CLEANING ###
################

cases <- cases %>% 
  mutate(year = year(year)) %>%
  mutate(minor_sex = ifelse(minor_sex == 'true', 1, 0)) %>%
  mutate(adult_sex = ifelse(adult_sex == 'true', 1, 0)) %>%
  mutate(labor = ifelse(labor == 'true', 1, 0)) %>%
  mutate(female_vics = ifelse(female_vics > 0, 1, 0)) %>%
  mutate(male_vics = ifelse(male_vics > 0, 1, 0)) %>%
  mutate(foreign_vics = ifelse(foreign_vics > 0 , 1, 0)) %>%
  mutate(recruit = ifelse(recruit == 'unknown', 0, recruit)) %>%
  mutate(recruit = ifelse(recruit == 'other', 0, recruit)) %>%
  mutate(recruit = ifelse(recruit == 'online', 1, recruit)) %>%
  mutate(recruit = ifelse(recruit == 'kidnap', 2, recruit)) %>%
  mutate(recruit = ifelse(recruit == 'face-to-face', 3, recruit)) %>%
  mutate(recruit = ifelse(recruit == 'telephone', 4, recruit)) %>%
  mutate(recruit = ifelse(recruit == 'family', 5, recruit)) %>%
  mutate(recruit = ifelse(recruit == 'newspaper', 6, recruit))

cases <- transform(cases, recruit = as.numeric(recruit))

#####

defendants <- defendants %>% 
  mutate(sentence = ifelse(sentence == 999, NA, sentence)) %>% #999 is for unknown
  mutate(sentence = sentence / 12) %>%
  filter(!is.na(sentence)) %>%
  filter(sentence < mean(sentence) + 2*sd(sentence)) %>% #remove outliers (2+ std above mean)
  mutate(def_gender = ifelse(def_gender == 2, NA, def_gender))

#####

judges <- judges %>%
  mutate(judge_gender = ifelse(judge_gender == 'Male', 0, 1)) %>%
  mutate(appointed_by = ifelse(appointed_by == 'Democrat', 1, 0)) %>%
  mutate(judge_race = ifelse(judge_race == 'White', 0, judge_race)) %>%
  mutate(judge_race = ifelse(judge_race == 'Black', 1, judge_race)) %>%
  mutate(judge_race = ifelse(judge_race == 'Hispanic', 2, judge_race)) %>%
  mutate(judge_race = ifelse(judge_race == 'Asian', 3, judge_race)) %>%
  mutate(judge_race = ifelse(judge_race == 'Indian', NA, judge_race)) %>%
  mutate(judge_race = ifelse(judge_race == 'Other', NA, judge_race))

judges <- transform(judges, judge_race = as.numeric(judge_race))

#####

northeast <- c("Connecticut", "CT", "Maine", "ME", "Massachusetts", "MA", 
               "New Hampshire", "NH", "Rhode Island", "RI", "Vermont", 
               "VT", "New Jersey", "NJ", "New York", "NY", "Pennsylvania", "PA",
               'District of Colombia', 'D.C.', 'Washington D.C.')

midwest <- c("Illinois", "IL", "Indiana", "IN", "Michigan", "MI", "Ohio", "OH",
             "Wisconsin", "WI", "Iowa", "IA", "Kansas", "KS", "Minnesota", 
             "MN", "Missouri", "MO", "Nebraska", "NE", "ND", "SD", 
             "North Dakota", "South Dakota")

south <- c("Delaware", "DE", "Florida", "FL", "Georgia", "GA", "Maryland", "MD",
           "North Carolina", "NC", "South Carolina", "SC", "Virginia", "VA", 
           "District of Columbia", "DC", "West Virginia", "WV", "Alabama", 
           "AL", "Kentucky", "KY", "Mississippi", "MS", "Tennessee", "TN",
           "Arkansas", "AR", "Louisiana", "LA", "Oklahoma", "OK", "Texas", "TX",
           "Guam", 'Puerto Rico', 'PR')

west <- c("Arizona", "AZ", "Colorado", "CO", "Idaho", "ID", "Montana", "MT", 
          "Nevada", "NV", "New Mexico", "NM", "Utah", "UT", "Wyoming", "WY", 
          "Alaska", "AK", "California", "CA", "Hawaii", "HI", "Oregon", 
          "OR", "Washington", "WA")


crime_locations <- crime_locations %>%
  mutate(region = ifelse(region %in% south, 0, region)) %>%
  mutate(region = ifelse(region %in% northeast, 1, region)) %>%
  mutate(region = ifelse(region %in% west, 2, region)) %>%
  mutate(region = ifelse(region %in% midwest, 3, region))

crime_locations <- transform(crime_locations, region = as.numeric(region))

###############
### JOINING ###
###############

jud_def <- full_join(judges, defendants, by = 'judge_id')
case_loc <- full_join(cases, crime_locations, by = 'case_id')
ht_sentencing <- full_join(case_loc, jud_def, by = 'case_id')
ht_sentencing <- filter(ht_sentencing, !is.na(sentence))

####categories: 
#0 = only male victims, 1 = only female victims
#1 = labor, 2 = adult sex, 3 = minor sex
#year categories 1:(2000-2003), 2:(2004-2007), 3:(2008-2011), 4:(2012-2015)

ht_sentencing <- ht_sentencing %>%
                  mutate(vic_gender = ifelse(male_vics == 1 & female_vics == 0, 0, NA)) %>%
                  mutate(vic_gender = ifelse(male_vics == 0 & female_vics == 1, 1, vic_gender)) %>%
                  mutate(type = ifelse(labor == 1 & adult_sex == 0 & minor_sex == 0, 1, NA)) %>%
                  mutate(type = ifelse(labor == 0 & adult_sex == 1 & minor_sex == 0, 2, type)) %>%
                  mutate(type = ifelse(labor == 0 & adult_sex == 0 & minor_sex == 1, 3, type)) %>%
                  mutate(year_group = ifelse(year >= 2000 & year <=2003, 1, NA)) %>%
                  mutate(year_group = ifelse(year >= 2004 & year <= 2007, 2, year_group)) %>%
                  mutate(year_group = ifelse(year >= 2008 & year <= 2011, 3, year_group)) %>%
                  mutate(year_group = ifelse(year >= 2012 & year <= 2015, 4, year_group))
              

ht_sentencing <- ht_sentencing[c('recruit', 'foreign_vics', 'region', 'judge_gender', 'judge_race',
                                 'appointed_by', 'def_gender', 'def_race', 'sentence', 'vic_gender',
                                 'type', 'year_group')]

###############
#### WRITE ####
###############

write_csv(ht_sentencing, '../joined_data/ht_sentencing.csv')



