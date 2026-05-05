# Pet Runner Mobile ChatGPT Asset Prompts

Use these prompts in the ChatGPT mobile app or development image generator. Upload `screenshot.png` with every prompt as the style/quality reference. Upload `sample.jpg` only for the character prompt.

Save the final files under `assets/generated/` with the exact filenames below.

## 1. `bg-1.png`, `bg-2.png`, `bg-3.png`

```text
Create three production-quality 2D mobile runner game background segments that match the exact hand-painted cute cozy cat-room fantasy style, rendering quality, warm lighting, soft brush texture, rounded shapes, and color depth of the uploaded screenshot reference.

Background-only asset. Remove all UI, buttons, counters, coins, enemies, player character, text, pause icon, and foreground collectibles.

Scene sequence: segment 1 shows the left side of the cat room, segment 2 shows the middle, and segment 3 shows the right side. Use cat towers, arched windows, shelves with cat decor, cat-shaped fireplace, framed paw art, plants, and warm lamp glow across the three segments.

Composition: each segment is 1604:981. Keep the same floor platform height, tile size, perspective, wall color, lighting direction, and horizon line across all three. Keep a clear horizontal gameplay lane across the lower third with a continuous tiled golden platform floor. Do not place cushions, beds, baskets, toys, plants, rugs, or furniture on top of the playable lane. Background details above should be rich but quieter than the play lane.

Style: polished mobile game screenshot quality, painterly but crisp, cute casual Korean/Japanese mobile game look, soft outlines, warm bounce light, high-contrast foreground floor.

Avoid: no text, no logos, no UI, no coins, no player, no enemies, no obstacles, no objects on the running lane, no watermark, no dark muddy palette.
```

## 2. `run-sheet.png`

Upload `screenshot.png` and `sample.jpg`.

```text
Create a transparent PNG sprite sheet for the player character's running/walking cycle in the exact same hand-painted cute runner-game style and quality as the uploaded screenshot reference.

Character identity from the uploaded pet photo: silver tabby cat, big expressive amber eyes, wearing a soft green knitted frog-like bonnet/hat with small blue-green pom poms and a small bow under the chin. Make the cat cute chibi mobile-game quality, thick soft outlines, painterly highlights, rounded paws, bright face.

Sheet layout: exactly 4 columns and 2 rows, total 8 equal cells. Reading order is left-to-right across the top row, then left-to-right across the bottom row. Each cell contains one full-body running/walking pose centered with generous padding. No jump frame and no slide frame in this sheet.

Critical animation requirement: make a healthy natural slightly bouncy jog cycle using BOTH front legs and BOTH hind legs. All four legs must be visible in every frame. Make the camera a slight 3/4 front-side view, not a pure flat side view, so both rear legs can be seen. Make the near-side legs light and prominent; make the far-side legs slightly darker, visibly offset, and outlined so they remain readable behind/under the body. The most visible rear hind leg must often bend forward under the belly or step forward, not trail backward in the air. In most frames the visible rear paw should appear under the hip or slightly forward of the hip, close to the ground baseline. Avoid long backward-floating hind legs. Avoid any frame where the cat seems to move only with the front legs. Keep the body, head, hat, and tail consistent in size and position across frames.

Output: transparent PNG. No background, no shadow, no floor, no UI, no text, no props except the green knitted hat and bow. Do not crop ears, paws, or tail.
```

## 3. `character-sheet.png`

Upload `screenshot.png` and `sample.jpg`.

```text
Create a transparent PNG sprite sheet for the player character action poses in the exact same hand-painted cute runner-game style and quality as the uploaded screenshot reference.

Character identity from the uploaded pet photo: silver tabby cat, big expressive amber eyes, wearing a soft green knitted frog-like bonnet/hat with small blue-green pom poms and a small bow under the chin. Match the run-sheet character exactly.

Sheet layout: exactly 6 equal columns and 1 row. Columns 1-4 may contain idle/reference run poses, column 5 must be a jump pose, and column 6 must be a low slide pose. The web game uses column 5 for jump and column 6 for slide.

Output: transparent PNG. No background, no shadow, no floor, no UI, no text, no props except the green knitted hat and bow. Do not crop ears, paws, or tail.
```

## 4. `items-sheet.png`

```text
Create a transparent PNG sprite sheet of collectible items in the exact same polished hand-painted cute mobile runner style and quality as the uploaded screenshot reference.

Sheet layout: exactly 5 equal columns and 1 row. One centered item per cell with generous padding:
1. pink paw coin
2. blue invincibility shield charm
3. pink sticker capsule/can
4. golden sticker capsule
5. green lucky clover item

Keep all items similar visual scale, readable at small size, glossy highlights, soft outlines, sparkle-ready shape language.

Output: transparent PNG. No background, no shadow outside the objects, no text, no numbers, no UI frame, no watermark, no extra items, no cropped objects.
```

## 5. `obstacles-sheet.png`

```text
Create a transparent PNG sprite sheet of runner obstacles in the exact same hand-painted cute mobile game style and quality as the uploaded screenshot reference.

Sheet layout: exactly 4 equal columns and 1 row. One centered object per cell with generous padding:
1. angry tangled purple yarn ball floor obstacle that a cat should jump over
2. hanging gray dust mop / dangling fringe hazard with an annoyed face, clearly suspended from above, low enough that the cat must slide under it
3. angry robot vacuum or wind-up mouse toy floor obstacle with pink wheels, clearly something a cat should jump over
4. dangling golden fish toy hazard with a little grumpy face, clearly hanging from above so the cat must slide under it

Keep each object readable, cute but obstructive, with expressive faces, soft outlines, painterly texture, strong contrast, and matching warm indoor cat-room lighting. Floor obstacles must sit on the bottom baseline; hanging obstacles must have a clear string, bracket, or top attachment so their avoid type is obvious.

Output: transparent PNG. No background, no UI frame, no text, no watermark, no extra objects, no cropped hazards.
```

## 6. `ui-sheet.png`

```text
Create a transparent PNG sprite sheet of game UI assets in the exact same glossy rounded paw-themed mobile UI style and quality as the uploaded screenshot reference.

Sheet layout: exactly 6 equal columns and 1 row. One centered UI asset per cell with generous padding:
1. large circular JUMP paw button without text
2. large circular SLIDE paw button without text
3. pink heart health icon
4. pink canned snack inventory icon
5. white wing powerup icon
6. paw shield icon

The two control buttons should be larger than the inventory icons but fully contained in their cells. Match the screenshot's glossy dark glass button ring, pink paw symbol, high contrast, and polished mobile game UI quality.

Output: transparent PNG. No background, no text, no numbers, no watermark, no extra icons, no cropped objects.
```

## 7. `pause-button.png`

```text
Create one transparent PNG UI icon in the exact same glossy rounded mobile-game UI style and quality as the uploaded Pet Runner screenshot reference.

Asset: one large circular pause button. It should be a dark glass circular button with a thick translucent rim, two white vertical pause bars, soft highlights, painterly polish, high contrast, and cute premium casual game quality.

Composition: one centered complete circular pause button with generous padding.

Output: transparent PNG. No background, no text, no numbers, no extra icons, no watermark, no cropped edges.
```

## 8. `action-sheet.png`

```text
Create a transparent PNG sprite sheet for distinct player action expressions in the exact same hand-painted cute runner-game style and quality as the uploaded screenshot reference.

Character identity from the uploaded pet photo: silver tabby cat, big expressive amber eyes, wearing a soft green knitted frog-like bonnet/hat with small blue-green pom poms and a small bow under the chin. Match the run-sheet character exactly.

Sheet layout: exactly 3 equal columns and 1 row. One complete centered character pose per cell with generous padding:
1. jump pose with excited open smile and bright wide eyes
2. low slide pose with focused determined eyes
3. invincibility shield pickup pose with confident happy expression

Output: transparent PNG. No background, no shadow, no floor, no UI, no text, no props except the green knitted hat and bow. Do not crop ears, paws, tail, hat, or pom poms.
```

## 9. `sticker-coins-sheet.png`

```text
Create a transparent PNG sprite sheet of six circular sticker coin icons in the exact same glossy hand-painted cute mobile runner style and quality as the uploaded screenshot reference.

Sheet layout: exactly 6 equal columns and 1 row. One centered circular gold coin icon per cell with generous padding. Each coin has a thick gold rim and a sticker illustration inside:
1. Happy Pet: smiling silver tabby cat face in green frog bonnet
2. Snack Master: canned fish treat and tiny paw sparkle
3. Tiny Pilot: cat face with pilot goggles and small wings
4. Brave Baby: paw shield / helmet motif with confident cat eyes
5. Dramatic Oops: dizzy surprised cat face with tiny star swirl
6. Golden Pet: shiny golden cat face with small crown and star sparkle

Output: transparent PNG. No background, no text, no numbers, no watermark, no extra icons, no cropped coin rims.
```

## 10. `sns-stickers-sheet.png`

```text
Create a transparent PNG sprite sheet of six SNS stickers based on the sticker-sample style and the sticker-guides.

Character identity: same silver tabby cat with green frog knitted bonnet, blue-green pom poms, and bow. Keep fur pattern, face shape, eye shape/color, proportions, outline weight, painterly texture, and colors consistent across every sticker.

Sheet layout: exactly 3 equal columns and 2 equal rows. One centered sticker per cell with thick white outer sticker border, dark inner outline, and generous padding.
1. Happy / Yay: big smile, sparkling eyes, both paws raised, sparkles
2. Thanks / Love: gentle smile, holding a heart
3. Tired / Sleepy: droopy eyes, yawning or lying down, zzz marks
4. Angry / Annoyed: puffed cheeks, crossed paws, cute frustration
5. Let's Go / Action: dynamic forward motion, pointing ahead or running
6. Sorry / Oops: shy embarrassed pose, bowed head, sweat drops

Output: transparent PNG. No background, no logo, no extra characters, no cropped border.
```
