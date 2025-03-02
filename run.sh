# Create a folder under the drive root
$ mkdir actions-runner; cd actions-runner
# Download the latest runner package
$ Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.322.0/actions-runner-win-x64-2.322.0.zip -OutFile actions-runner-win-x64-2.322.0.zip
# Optional: Validate the hash
$ if((Get-FileHash -Path actions-runner-win-x64-2.322.0.zip -Algorithm SHA256).Hash.ToUpper() -ne 'ace5de018c88492ca80a2323af53ff3f43d2c82741853efb302928f250516015'.ToUpper()){ throw 'Computed checksum did not match' }
# Extract the installer
$ Add-Type -AssemblyName System.IO.Compression.FileSystem ; [System.IO.Compression.ZipFile]::ExtractToDirectory("$PWD/actions-runner-win-x64-2.322.0.zip", "$PWD")
# Create the runner and start the configuration experience
$ ./config.cmd --url https://github.com/lucas-cimino/log-density-plugin-h25 --token AM63BTFLJYSVOYOGXWKM3E3HYTEWA
# Run it!
$ ./run.cmd