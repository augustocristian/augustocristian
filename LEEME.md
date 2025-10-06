# 1. Acknowledgments
This project is based on the [Hugo Academic Template](https://github.com/HugoBlox/theme-academic-cv), with the necessary modifications
# 2. Modify the website content and preview it locally
[Here](https://wowchemy.com/docs/getting-started/install-hugo-extended/) you'll find a comprehensive guide on the setup process. If you're using Windows, the steps are quite straightforward:

1. First, install the Scoop package manager in PowerShell by executing the following commands:
    ```powershell
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
    Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
    ```

2. Next, download the necessary packages for running the site:
    ```powershell
    scoop install git go hugo-extended nodejs
    ``` 

3. Navigate to your repository folder and launch Hugo:
    ```powershell
    hugo server
    ``` 

After completing these steps, you can access the website locally at http://localhost:port/. The port number depends on whether you have other services running locally. Upon running `hugo server`, you'll be able to see the port where the site is being displayed.

How to update-align hugo version with the template requirements
    ```powershell 
    scoop update hugo-extended 
    ``` 
# 3. Customization
## Icon Packages
For comprehensive information about standard icons, please refer to the [official website](https://github.com/hugo-mods/icons). Additionally, for advanced functionality and other icon sets, consider installing additional packages.