const { from } = require('rxjs')
const { map, mergeMap, toArray, mergeAll, pluck } = require('rxjs/operators')

const { getDeveloper, getDeveloperApps } = require('../endpoints/apigeeActions')

const apiProducts = () =>
  from(getDeveloper())
    .pipe(
      pluck('developer'),
      mergeAll(),
      mergeMap(developer => getDeveloper(developer.email)),
      mergeMap(({ apps, email }) =>
        from(apps).pipe(
          mergeMap(app => getDeveloperApps(email, app)),
          map(app => ({ email, ...app }))
        )
      ),
      map(app => {
        const { email: developer, name: developerApp, status: appStatus } = app

        //TODO: determine why credentials only have one member
        const apiProducts = app.credentials[0].apiProducts

        if (apiProducts.length == 0) {
          return [
            {
              developer,
              developerApp,
              appStatus,
              apiProduct: '---',
              apiStatus: '---'
            }
          ]
        } else {
          return apiProducts.reduce((products, product) => {
            const { status: apiStatus, apiproduct: apiProduct } = product
            products.push({
              developer,
              developerApp,
              appStatus,
              apiProduct,
              apiStatus
            })
            return products
          }, [])
        }
      }),
      mergeAll(),
      toArray()
    )
    .toPromise()

module.exports = {
  apiProducts
}
