#!/usr/bin/env python3
import json

#TODO: Add comand line options
#TODO: csv reader should look for indices on the header (lowercase)

# read species csv 
csv = []
header = True
with open("species.csv", "r") as stream:
    for line in stream:
        if not header: # ignore header
            csv.append(line.strip().split(","))
        header = False

# sort based on the first two columns (class, species)
csv = sorted(csv, key=lambda x:[x[0], x[1]])

# read additional info csv
info = {}
header = True
with open("info.csv", "r") as stream:
    for line in stream:
        if not header:
            txt = line.strip().split(",", 1)
            info[txt[0]] = txt[1]
        header = False


# Create Json structure
data = []

for line in csv:
    cl, sp, quad, val = line
    
    curClass = [x for x in data if x["name"] == cl]
    
    if len(curClass) == 0:
        addinfo = ""
        if cl in info.keys():
            addinfo = info[cl]
        curClass = [{"name": cl, "info": addinfo, "species": []}]
        data += curClass
    
    curSp = [x for x in curClass[0]["species"] if x["name"] == sp]
    
    if len(curSp) == 0:
        curSp = [{"name": sp, "quad": [], "value":[]}]
        curClass[0]["species"] += curSp
    
    if quad not in curSp[0]["quad"]:
        curSp[0]["quad"].append(quad)
        curSp[0]["value"].append([])
    
    curVal = curSp[0]["value"][curSp[0]["quad"].index(quad)]
    
    if val not in curVal:
        curVal.append(int(val))



with open("species.json", "w") as stream:
    stream.write(json.dumps(data, sort_keys=True))

