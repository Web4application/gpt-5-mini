$ export RUNNER_VERSION=$(curl -X 'GET' https://data.forgejo.org/api/v1/repos/forgejo/runner/releases/latest | jq .name -r | cut -c 2-)  
$ wget -O forgejo-runner https://code.forgejo.org/forgejo/runner/releases/download/v${RUNNER_VERSION}/forgejo-runner-${RUNNER_VERSION}-linux-amd64  
$ chmod +x forgejo-runner  
$ wget -O forgejo-runner.asc https://code.forgejo.org/forgejo/runner/releases/download/v${RUNNER_VERSION}/forgejo-runner-${RUNNER_VERSION}-linux-amd64.asc  
$ gpg --keyserver keys.openpgp.org --recv EB114F5E6C0DC2BCDD183550A4B61A2DC5923710  
$ gpg --verify forgejo-runner.asc forgejo-runner  
Good signature from "Forgejo <contact@forgejo.org>"  
		aka "Forgejo Releases <release@forgejo.org>"  
