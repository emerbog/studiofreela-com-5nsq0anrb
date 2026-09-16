migrate(
  (app) => {
    const quotes = app.findCollectionByNameOrId('quotes')

    if (!quotes.fields.getByName('syncStatus')) {
      quotes.fields.add(
        new SelectField({
          name: 'syncStatus',
          required: false,
          values: ['pending', 'synced', 'error'],
          maxSelect: 1,
        }),
      )
    }

    if (!quotes.fields.getByName('lastSyncAt')) {
      quotes.fields.add(new DateField({ name: 'lastSyncAt', required: false }))
    }

    if (!quotes.fields.getByName('syncError')) {
      quotes.fields.add(new TextField({ name: 'syncError', required: false }))
    }

    app.save(quotes)
  },
  (app) => {
    // Non-destructive rollback
  },
)
