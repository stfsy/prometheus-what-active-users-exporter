#!/bin/bash

set -ex

MAIN_BRANCH='master'
DEV_BRANCH='dev'

git checkout $MAIN_BRANCH
npm install
npm outdated || true

npm update
if [[ `git status --porcelain` ]]; then
    has_updates='1'
    npm test
    git add package*
    git commit -m "feat: update outdated dependencies"
fi

npm audit fix
if [[ `git status --porcelain` ]]; then
    has_updates='1'
    npm test
    git add package*
    git commit -m "feat: update vulnerable dependencies"
fi

npm audit fix --force
if [[ `git status --porcelain` ]]; then
    has_updates='1'
    set +e # unsetting this flag here because the breaking changes might cause us to break
    npm test
    git add package*
    git commit -m "feat: update vulnerable dependencies"
    set -e # setting the flag here again
fi

if [[ $has_updates -gt "0" ]]; then
    npm run release-minor
    git checkout $DEV_BRANCH || true
    git rebase $MAIN_BRANCH
fi