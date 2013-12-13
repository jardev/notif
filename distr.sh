git tag -a -f -m "Making release" release
git archive --prefix=notif/ release | gzip > notif.tar.gz
scp notif.tar.gz 78.47.90.54:~/