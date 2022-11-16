Contract and Subgraph Notes
updateEliminatedTeams - we run it daily manually and provide the eliminated teams - emits TeamsEliminated

Teams Data: MongoDB > Team Name, ID

Potentially will need a sports api for match up and times and days
or just show names of all teams on one page with if the team has already been picked
Where to add data for day the team is playing

MVP:

- \*\* Splash Page:
- Connect Wallet
- Hit subgraph, determine if user is registered

If not registered:

- \*\* Register Page
- Provide Name
- Verbiage for 10 USDC to be sent to contract
- 1 Tx to approve our contract address for 10 USDC
- 1 Tx to sign for us to get 10 USDC from their wallet
- loader while tx is going through and listener waiting on subgraph emission for registered user

If Registered:

- \*\* Pick Page (10 Days)
- Show Current Day, Current Days Teams, Pick Deadline
- User can pick a team that has not been picked
- sign a tx that sends the team number and the day number associated with picked team
- loader until tx is done
- show todays picked team (indicate that it is successful) and allow for change until deadline

Stats Page (Data to get from subgraph:)

- Total Pool - Total Entries \* 10 USDC
- Total Entries - from subgraph read on registerPoolEntry emission
- Surviving Entries
- Eliminated Entries
