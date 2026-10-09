<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application rules
- Keep the Allergy Rush registration, arena and results as states of the index route so the kiosk experience never navigates away during a round.
- Use Matter.js for enemy movement and shield collisions; use a monotonic clock for the round duration so render speed does not change game timing.
- Keep scoring constants and sample leaderboard data in the shared game-rules module so the future API integration has a single replacement boundary.
- Keep player details and scores in session React state only until a leaderboard API is supplied; never persist or transmit the registration details in practice mode.
- Use uploaded assets through Lovable Assets pointers and generated artwork as imported assets so originals remain unchanged.
- Keep synthesised game audio in a browser-only helper invoked after a player gesture so audio permissions and SSR are safe.
