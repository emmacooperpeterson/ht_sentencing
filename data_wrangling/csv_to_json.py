import csv
import json

def csv_to_json(csv_file, json_file, columns):
    '''
    csv_file and json_file are filepaths (strings)
    columns is a tuple of column names
    '''

    csvfile = open(csv_file, 'r')
    jsonfile = open(json_file, 'w')

    cols = columns
    reader = csv.DictReader(csvfile, cols)

    json_list = []

    for i, row in enumerate(reader):
        if i > 0:
            json_list.append(row)

    json.dump(json_list, jsonfile, indent=4)



if __name__ == '__main__':
    csv_file = '../joined_data/ht_sentencing.csv'
    json_file = '../ht_sentencing.json'
    columns = ('case_id', 'year', 'minor_sex',
                'adult_sex', 'labor', 'recruit',
                'female_vics', 'male_vics', 'foreign_vics',
                'region', 'judge_id', 'judge_gender', 'judge_race',
                'appointed_by', 'def_gender', 'def_race',
                'sentence', 'first_name')

    csv_to_json(csv_file, json_file, columns)
