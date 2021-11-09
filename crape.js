const rp = require('request-promise');
const cheerio = require('cheerio');
const url = 'https://27crags.com/crags/frank-slide/topos';
const fs = require('fs')

rp(url)
  .then(function(html){
    const $ = cheerio.load(html)
    const returnData = []
    
    $('a.sector-item').each((i, el) => {
      const sector = $(el).attr().title
      const reference = 'https://27crags.com' + $(el).attr().href

      returnData[i] = {
        sector,
        reference,
      }
    })

    return returnData
  })
  .then(function(data) {
    let frankData = []
    let promiseArray = []

    data.forEach((el) => {
      const promiseRequest = rp(el.reference)
      .then(function(html) {
        let returnData = el
        const $ = cheerio.load(html)

        const coordinates = $('a.sector-property').text().split(', ')
        coordinates[0] = +coordinates[0].replace('\n\n', '')
        coordinates[1] = +coordinates[1].replace('\n', '')

        const problems = []
        
        $('li.route').each((i, el) => {
          const title = $(el).find('.route-name').text().split(', ')
          const grade = title[1].replace('\n\n', '')
          const name = title[0].replace('\n\n', '')
          const description = $(el).find('.route-info').text()

          problems.push({
            name,
            grade,
            description
          })
        })
        
        returnData.lat = coordinates[0]
        returnData.long = coordinates[1]

        returnData.problems = problems

        return returnData
      })
      .catch((err) => {
        //error
      })
      promiseArray.push(promiseRequest)
    })

    Promise.all(promiseArray)
    .then((stuff) => {
      let jsonData = stuff.filter((element) => {
        return element !== undefined
      })

      fs.writeFile('frank.json', JSON.stringify(jsonData), function(err) {
        console.log(err)
      })
    })
    return data
  })
  .catch(function(err){
    console.log('herro')
    //handle error
  });

