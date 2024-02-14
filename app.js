const express = require('express')
const app = express()
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')
const filePath = path.join(__dirname, 'covid19India.db')
let db = null
app.use(express.json())

const intializeDBAndServer = async () => {
  db = await open({
    filename: filePath,
    driver: sqlite3.Database,
  })
  app.listen(3000, () => {
    console.log('Server runnig at https://localhost:3000/')
  })
}

intializeDBAndServer()

// API 1
// Returns the list of states in the state table...

app.get('/states/', async (req, res) => {
  const getStatesQuery = `SELECT * FROM state;`
  const dbResponse = await db.all(getStatesQuery)
  res.send(
    dbResponse.map(function (dbObject) {
      return {
        stateId: dbObject.state_id,
        stateName: dbObject.state_name,
        population: dbObject.population,
      }
    }),
  )
})

//API 2
// Returns a state based on the state_id....
app.get('/states/:stateid/', async (req, res) => {
  const {stateid} = req.params

  const getStateQuery = `SELECT * FROM state WHERE state_Id = ${stateid};`
  const dbRes = await db.get(getStateQuery)
  res.send({
    stateId: dbRes.state_id,
    stateName: dbRes.state_name,
    population: dbRes.population,
  })
})

module.exports = app

//API 3
// Create a district  in the district table
app.post('/districts/', async (req, res) => {
  const districtDetails = req.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  try {
    const insertQuery = `INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
    VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});`
    await db.run(insertQuery)
    res.send('District Successfully Added')
  } catch (err) {
    console.log(err)
  }
})

//API 4
//Returns district based on the district_id
app.get('/districts/:districtId/', async (req, res) => {
  const {districtId} = req.params
  const getDistrictQuery = `SELECT * FROM district where district_id = ${districtId};`
  const dbResponse = await db.get(getDistrictQuery)
  if (dbResponse === undefined) {
    res.send('No such record exists...')
  } else {
    res.send({
      districtId: dbResponse.district_id,
      districtName: dbResponse.district_name,
      stateId: dbResponse.state_id,
      cases: dbResponse.cases,
      cured: dbResponse.cured,
      active: dbResponse.cured,
      deaths: dbResponse.deaths,
    })
  }
})

//API 5
//Delete district based on the district_id...
app.delete('/districts/:districtId', async (req, res) => {
  const {districtId} = req.params
  const delteQuery = `DELETE FROM district WHERE district_id = ${districtId};`
  await db.run(delteQuery)
  res.send('District Removed')
})

// API 6
//Update the details of specific district based on the district_id....
app.put('/districts/:districtId/', async (req, res) => {
  const {districtId} = req.params
  const districtDetails = req.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const updateQuerry = `UPDATE district SET 
  district_name = '${districtName}',
  state_id = ${stateId},
  cases = ${cases},
  cured = ${cured},
  active = ${active},
  deaths = ${deaths}
  where district_id = ${districtId}`
  await db.run(updateQuerry)
  res.send('District Details Updated')
})

// API 7
//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID

app.get('/states/:stateId/stats/', async (req, res) => {
  const {stateId} = req.params
  const statsQuery = `SELECT SUM(cases) as totalCases,SUM(cured) as totalCured,SUM(active) as totalActive,
  SUM(deaths) as totalDeaths from district where state_id = ${stateId} 
  ;`
  const dbResponse = await db.get(statsQuery)
  res.send(dbResponse)
})

//API 8
//Returns an object containing the state name of a district based on the district ID
app.get('/districts/:districtId/details/', async (req, res) => {
  const {districtId} = req.params
  const getStateQuery = `SELECT state_name as stateName FROM state INNER JOIN district ON state.state_id = district.state_id WHERE district_id = ${districtId};`
  const dbResponse = await db.get(getStateQuery)
  res.send(dbResponse)
})



module.exports = app;
