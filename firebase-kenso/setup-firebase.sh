#
# install nodejs firebase package
#
npm -g install firebase-tools

#
# install conda firebase env and install firebase modules
#
conda create -n firebase  python=3
conda activate firebase 
pip install firebase

#
# Login to firebase
# 
firebase login
#
# start the local server for  testing
#
firebase serve
