#!/bin/bash

CHANGELOG="CHANGELOG.md"
NEWLINE="\n"

first_release_processed='false'
has_linebreak='false'

text=''

while IFS= read -r line; do
    if [[ $line == "# "*  ]]; then
        if  [[ $first_release_processed == "false" ]]; then
            first_release_processed="true"
        else
            break
        fi
    fi

    if [[ -z $line ]]; then
        if [[ $has_linebreak == 'false' ]]; then
            has_linebreak='true'
        else
            continue
        fi
    else
        has_linebreak='false'
    fi

    text="$text ${line} ${NEWLINE}"

done < "$CHANGELOG"

echo -e "$text"