## Harbor & Vine detailed restaurant site

Pages: homepage, menu, live wine list, private dining, story, contact, and reservations.

### Google Sheet wine connection
- Create a dedicated public tab named Wine List.
- Use headers: Name, Producer, Vintage, Type, Country, Region, Grape, Bottle Price, Glass Price, Stock, Featured, Notes.
- In Google Sheets select **File > Share > Publish to web**. Choose only the Wine List tab and choose **CSV**.
- Copy the published CSV URL into wine-config.js.
- Keep sensitive information out of the published tab because published content is public.

The wine page searches names, producers, grapes, regions, countries and notes. It filters type, country, in-stock status and by-the-glass availability.

### Google Sheet menu connection
- Use a second tab named Menu in the same workbook.
- Use headers: Category, Item, Description, Price, Price Note, Available, Featured, Dietary, Sort Order.
- Publish the Menu tab separately as CSV and paste that URL into menu-config.js.
- Set Available to No to hide an item without deleting it.

### Themed cursors and backgrounds
theme-fx.css and theme-fx.js add a unique cursor, click animation and ambient
background to every theme. The theme is detected from the page's own
theme-*.css stylesheet, so no per-page configuration is needed.
