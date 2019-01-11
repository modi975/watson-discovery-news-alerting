/**
 * Copyright 2017 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts/lib'
import { Row, Col, FormGroup, InputGroup, FormControl, Button, Alert, ListGroup, ListGroupItem, Modal} from 'react-bootstrap'
import { JsonLinkInline} from 'watson-react-components/dist/components'
import { Tracking } from './tracking'
import { leftPad } from '../models/frequency'

import { BRAND_ALERTS, PRODUCT_ALERTS, RELATED_BRANDS, POSITIVE_PRODUCT_ALERTS, STOCK_ALERTS, ALL_ALERTS } from '../watson/constants'

// Taken from https://github.com/github/fetch/issues/256
function toQueryString(params) {
  return Object.keys(params)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&')
}

// This is a default example of using recharts, it's a well documented project and easy to implement with Watson aggregations
class SimpleLineChart extends Component {
  constructor(props) {
    super(props)
    this.state = {
      data: props.data,
      name: props.name,
      ar: props.ar
    }
    // console.log(this.state)
  }
  // margin={{top: 5, right: 30, left: 20, bottom: 5}}
  render() {
    return (
      <ResponsiveContainer width='88%' aspect={this.state.ar}>
        <LineChart data={this.state.data}>
          <XAxis dataKey='name'/>
          <YAxis/>
          <CartesianGrid strokeDasharray='3 3'/>
          <Tooltip/>
          <Line name={this.state.name} type='monotone' dataKey='amount' stroke='rgb(241, 224, 90)' activeDot={{r: 8}}/>
        </LineChart>
      </ResponsiveContainer>
    )
  }
}
SimpleLineChart.propTypes = {
  name: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired
}

// Modal to show individual alerts
class DetailsModal extends React.Component {
  render() {
    return(
      <Modal
      {...this.props}
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg"><h4>{this.props.data.title}</h4></Modal.Title>
      </Modal.Header>
        <Modal.Body>
          {/* {console.log(this.props.data)} */}
          <div>
            <Row className="no-margin">
              <Col md={12} className="no-padding">
                <Row className="no-margin">
                  <Col md={12} className="no-padding">
                    <SimpleLineChart  ar={16.0 / 7.0} data={this.props.data.aggregationData} name={this.props.data.title} />
                  </Col>
                </Row>
                <Row className="no-margin">
                  <Col md={12} className="no-padding">
                    <ListGroup>
                      {this.props.data.results && this.props.data.results.map((result, j) =>
                        <ListGroupItem key={j} href={result.url} title={result.title} target='_blank' style={{padding: 2 + 'px ' + 12 + 'px'}}>
                          <span className='extra-right-space'>Score: {result.score.toPrecision(2)}</span>
                          {result.title}
                          {result.alchemyapi_text
                            ? (<p>{result.alchemyapi_text}</p>)
                            : ('')
                          }
                        </ListGroupItem>
                      )}
                    </ListGroup>
                  </Col>
                </Row>
              </Col>
            </Row>
          </div>
        </Modal.Body>
      <Modal.Footer>
        <Button onClick={this.props.onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
    );
  }
}
// DetailsModal.propTypes = {
//   title: PropTypes.string.isRequired
// }

const Loader = (props) => {
  const cols = props.cols
  return (
    <Col md={cols}>
      <div className='center-block text-center'>
        <div className="loader"></div>
        <p>Loading Alerts from Watson</p>
      </div>
    </Col>
  )
}
Loader.propTypes = {
  cols: PropTypes.number.isRequired
}

// This is the generic alert, it doesn't render much of anything and is primarily used as a basis for shared code which is executed for each
// type of alert (Brand Alert, Product Alert, Related Brands...)
class AlertExample extends Component {
  constructor(props) {
    super(props)

    this.state = {
      match: props.match,
      params: new URLSearchParams(props.location.search),  // In this version of React Router, it doesn't parse QSP
      error: false,
      loading: false,
      exampleResponse: null,
      showExampleAggregationResponse: false,
      showExampleResultResponse: false,
      aggregationData: null,
      resArray: [],
      detailsShow: false,
      modalData: {}
    }
    this.getAlerts = this.getAlerts.bind(this)
    this.getAAlerts = this.getAAlerts.bind(this)
    this.parseBody = this.parseBody.bind(this)
    this.parseAllBody = this.parseAllBody.bind(this)
    this.showResultsOrError = this.showResultsOrError.bind(this)
    this.renderSearchBox = this.renderSearchBox.bind(this)
    // this.detailsClose = this.detailsClose.bind(this)
    // this.detailsOpen = this.detailsOpen.bind(this)
    // this.getBrandAlerts = this.getBrandAlerts.bind(this)
    // this.getProductAlerts = this.getProductAlerts.bind(this) 
    // this.getRealtedAlerts = this.getRealtedAlerts.bind(this)
    // this.getPositiveProductAlerts = this.getPositiveProductAlerts.bind(this) 
    // this.getStockAlerts = this.getStockAlerts.bind(this)

    this.onExitExampleAggregationResponse = this.onExitExampleAggregationResponse.bind(this)
    this.onShowExampleAggregationResponse = this.onShowExampleAggregationResponse.bind(this)
    this.onExitExampleResultResponse = this.onExitExampleResultResponse.bind(this)
    this.onShowExampleResultResponse = this.onShowExampleResultResponse.bind(this)
  }

  onExitExampleAggregationResponse() {
    this.setState({
      showExampleAggregationResponse: false
    })
  }

  onShowExampleAggregationResponse() {
    this.setState({
      showExampleAggregationResponse: !this.state.showExampleAggregationResponse
    })
  }

  onExitExampleResultResponse() {
    this.setState({
      showExampleResultResponse: false
    })
  }

  onShowExampleResultResponse() {
    this.setState({
      showExampleResultResponse: !this.state.showExampleResultResponse
    })
  }

  // Sort each article returned by its date in the aggregation results, this is used to make the chart legible.
  // TODO move to the chart code
  sort(a, b) {
    if (a.date > b.date) {
      return 1
    } else if (a.date < b.date) {
      return -1
    } else {
      return 0
    }
  }

  // The response is in the correct format for display in list for but the aggregations need the dates converted back from strings.
  parseBody(body) {
    const data = []
    for (const result of body.aggregations[0].results) {
      const date = new Date(0)
      // The date is in milliseconds provided by Watson, NOTE milliseconds!
      date.setUTCSeconds(result.key / 1000)
      data.push({
        name: `${leftPad(date.getUTCMonth() + 1, '0', 2)}/${leftPad(date.getUTCDate(), '0', 2)}`,  // Change the date format to be MM/DD
        amount: result.matching_results,
        date: date})
    }
    const sorted = data.sort(this.sort)
    this.setState({
      loading: false,
      aggregationData: sorted,
      exampleAggregationResponse: body.aggregations,
      exampleResultResponse: body.results
    })
  }

  // The response is in the correct format for display in list for but the aggregations need the dates converted back from strings.
  parseAllBody() {
    // console.log(this.state)
    var newResArray = this.state.resArray;
    for (let respo of this.state.resArray) {
      const data = []
      // console.log(respo)
      if (respo.title !== '360° VIEW OF YOUR BRAND') {
        for (const result of respo.aggregations[0].results) {
          const date = new Date(0)
          // The date is in milliseconds provided by Watson, NOTE milliseconds!
          date.setUTCSeconds(result.key / 1000)
          data.push({
            name: `${leftPad(date.getUTCMonth() + 1, '0', 2)}/${leftPad(date.getUTCDate(), '0', 2)}`,  // Change the date format to be MM/DD
            amount: result.matching_results,
            date: date})
        }
        respo['aggregationData'] = data.sort(this.sort)
      }
      // const sorted = data.sort(this.sort)
    }
    this.setState({
      loading: false,
      resArray: newResArray
    }) 
  }

  getAlerts(url) {
    this.setState({loading: true})
    fetch(url)
      .then((res) => res.json())
      .then(this.parseBody)
      .catch((error) => {
        this.setState({
          loading: false,
          error: true})
        console.error(error)
      })
  }

  getBrandAlerts(tag) {
    return fetch(`/api/1/track/brand-alerts/?brand_name=${tag}`)
      .then((res) => res.json())
  }
  getProductAlerts(tag) {
    return fetch(`/api/1/track/product-alerts/?product_name=${tag}`)
      .then((res) => res.json())
  }
  getRealtedAlerts(tag) {
    return fetch(`/api/1/track/related-brands/?brand_name=${tag}`)
      .then((res) => res.json())
  }
  getPositiveProductAlerts(tag) {
    return fetch(`/api/1/track/positive-product-alerts/?product_name=${tag}`)
      .then((res) => res.json())
  }
  getStockAlerts(tag) {
    return fetch(`/api/1/track/stock-alerts/?stock_symbol=${tag}`)
      .then((res) => res.json())
  }

  getAAlertsPre(tag) {
    return Promise.all([this.getBrandAlerts(tag), this.getProductAlerts(tag), this.getRealtedAlerts(tag), this.getPositiveProductAlerts(tag), this.getStockAlerts(tag)])
  }

  getAAlerts(tag) {
    this.setState({loading: true})
    this.getAAlertsPre(tag)
      .then(([brands, products, related, positive, stocks]) => {
        let resArray = []
        let extraobj = {}
        brands['title'] = 'Brand Alerts'
        products['title'] = 'Product Alerts' 
        related['title'] = 'Related Brands'
        positive['title'] = 'Positive Product Alerts'
        stocks['title'] = 'Stock Alerts'
        extraobj['title'] = '360° VIEW OF YOUR BRAND'
        
        resArray.push(brands)
        resArray.push(products)
        resArray.push(related)
        resArray.push(positive)
        resArray.push(stocks)
        resArray.push(extraobj)
        this.setState({ resArray: resArray, loading: false })
        this.parseAllBody()
      // both have loaded!
    })
    // let apiarray = [
    //   {'api': `/api/1/track/brand-alerts/?brand_name=${tag}`, 'title': 'Brand Alerts'},
    //   {'api': `/api/1/track/product-alerts/?product_name=${tag}`, 'title': 'Product Alerts'},
    //   {'api': `/api/1/track/related-brands/?brand_name=${tag}`, 'title': 'Related Brands'},
    //   {'api': `/api/1/track/positive-product-alerts/?product_name=${tag}`, 'title': 'Positive Product Alerts'},
    //   {'api': `/api/1/track/stock-alerts/?stock_symbol=${tag}`, 'title': 'Stock Alerts'}
    // ]
    // let resArray = []
    // apiarray.forEach(function (apiobj, index) {
    //   fetch(apiobj.api)
    //   .then((res) => res.json())
    //   .then(data => {
    //     data['title'] = apiobj.title
    //     console.log(data)
    //     console.log(index)
    //     if (index <= 4) {
    //       resArray.push(data)
    //     } else {
    //       this.setState({ resArray: resArray, loading: false })
    //       this.parseAllBody()
    //     }
    //   })
    //   .catch((error) => {
    //     this.setState({
    //       loading: false,
    //       error: true})
    //     console.error(error)
    //   })      
    // })
  }

  renderSearchBox() {
    return (
      <Row>
        <Col md={12}>
          <h1>Enter Search</h1>
        </Col>
      </Row>
    )
  }

  // detailsClose() {this.setState({ detailsShow: false });}
  // detailsOpen() {this.setState({ detailsShow: true });}
  // renderCards(card, i) {
  //   return (
  //     <Col md={3} className='card-col' key={i}>
  //       <div className='card'>
  //         <h4 style={{marginTop: '3px', marginBottom: '3px', color: '#fff'}}>{card.title}</h4>
  //       </div>
  //     </Col>
  //   )
  // }
  // TODO Instead of doing the big if/elses here, it'd be preferable to separate into different components so that it's easier to debug when
  // certain state issues occur
  showResultsOrError() {
    if (this.state.loading) {
      return (<Row><Loader cols={12} /></Row>)
    } else if (this.state.error) {
      return (
        <div>
          <Row>
            <Col md={12}>
              <Alert bsStyle="danger">
                <p className='base--p'>There was an error loading results from Watson, please try again.</p>
              </Alert>
            </Col>
          </Row>
          {this.renderSearchBox()}
        </div>
      )
    } else if (this.state.exampleResultResponse && this.state.exampleResultResponse.length === 0) {
      return (
        <div>
          <Row>
            <Col md={12}>
              <Alert bsStyle="warning">
                <p className="base--p">There were no results found for this query, please try another keyword.</p>
              </Alert>
            </Col>
          </Row>
          {this.renderSearchBox()}
          <Tracking query={this.state.query} keyword={this.state.keyword}  />
        </div>
      )
    } else if(this.state.keyword === null || typeof this.state.keyword === 'undefined' || this.state.keyword === '') {
      // This is primarily to avoid using == to check the keyword == null
      return this.renderSearchBox()
    } else {
      if (this.state.resArray.length === 0) {
        return (
          <div className="card">
            {this.renderSearchBox()}
            <Tracking query={this.state.query} keyword={this.state.keyword}  />
            <Row>
              <Col md={6} mdPush={6}>
                <Row className='card-body'>
                  <Col md={12}>
                    <h2>Visualization of <b>aggregation</b> results</h2>
                    <SimpleLineChart  ar={16.0 / 9.0} data={this.state.aggregationData} name='Matching articles per day' />
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <JsonLinkInline
                      json={this.state.exampleAggregationResponse}
                      showJson={this.state.showExampleAggregationResponse}
                      onExit={this.onExitExampleAggregationResponse}
                      onShow={this.onShowExampleAggregationResponse}
                      description={<p>Inspect raw aggregation response from Watson&rsquo;s Discovery News used to build the visualization</p>}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <JsonLinkInline
                      json={this.state.exampleResultResponse}
                      showJson={this.state.showExampleResultResponse}
                      onExit={this.onExitExampleResultResponse}
                      onShow={this.onShowExampleResultResponse}
                      description={<p>Inspect raw results response from Watson&rsquo;s Discovery News used in the listing of results</p>}
                    />
                  </Col>
                </Row>
              </Col>
              <Col md={6} mdPull={6}>
                <h2>Results</h2>
                <p>These articles are pulled from Watson&rsquo;s Discovery News based on a query and filtering for relevance</p>
                {this.state.exampleResultResponse && this.state.exampleResultResponse.map((result, i) =>
                  <div key={i}>
                    <h3>
                      <span className='extra-right-space'>Score: {result.score.toPrecision(2)}</span>
                      <a href={result.url} title={result.title}>{result.title}</a>
                    </h3>
                    <p>{result.alchemyapi_text}</p>
                  </div>
                )}
              </Col>
            </Row>
          </div>
        )
      } else {
        // let modalData = {}
        let detailsClose = () => this.setState({ detailsShow: false });
        let detailsOpen = (cardo) => {
          // console.log(cardo);
          // modalData = cardo
          this.setState({ detailsShow: true, modalData: cardo });
        }
        return (
          <div>
          {this.state.resArray[0].aggregationData && this.state.resArray.map((card, i) =>
            <Col md={4} className='card-col no-padding' key={i}>
              {function EmptyList(cardod) {
                let cardo = cardod.card
                if (cardo.title === "360° VIEW OF YOUR BRAND") {
                  return (
                    <div className='card' >
                      <Row className="no-margin" style={{backgroundColor: 'rgb(53, 53, 53)'}}>
                        <Col md={12} className="no-padding">
                          <h4 style={{marginTop: 3 + 'px', marginBottom: 3 + 'px', color: '#fff'}}>{cardo.title}</h4> 
                        </Col>
                      </Row>
                      <Row className="no-margin" >
                        <Col md={12} className="no-padding" >
                        <Row className="no-margin" style={{height: 5 + 'px',backgroundColor: '#f1e05a'}}>
                            <Col md={12} className='extra-right-space'>
                            <p>&nbsp;</p>
                            </Col>
                        </Row>    
                          <Row className="no-margin" style={{backgroundColor: 'white'}}>
                            <Col md={12} className='extra-right-space'><p></p>
                            Go beyond social to track discussions on online news sites, blogs, forums, offline databases and understand what your customers and prospects think of your brand
                            </Col>
                          </Row>
                          <Row className="no-margin" style={{backgroundColor: 'white'}}>
                            <Col md={12} className='extra-right-space' style={{height: 186 + 'px', overflow: 'auto'}}><p></p>
                            Never miss another opportunity to connect with your audience and react to issues as they happen. Discover how your brand assets are being used with fully integrated proprietary visual listening.
                            <p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p>
                            <p align='right' valign='bottom'><strong>Amitabh Kumar</strong></p>
                            <p align='right' valign='bottom'><strong>amitabh1.kumar@in.ey.com</strong></p>
                            </Col>
                          </Row>
                        </Col>
                      </Row>                
                    </div>
                  )
                } else {
                  return (
                    <div className='card'>
                      <Row className="no-margin" style={{backgroundColor: 'rgb(53, 53, 53)'}}>
                        <Col md={12} className="no-padding">
                          <h4 style={{marginTop: 3 + 'px', marginBottom: 3 + 'px', color: '#fff'}}>{cardo.title}</h4>    
                        </Col>
                      </Row>
                      <Row className="no-margin">
                        <Col md={12} className="no-padding">
                          <Row className="no-margin" onClick={() => {detailsOpen(cardo);}}>
                            <Col md={12} className="no-padding"style={{marginTop: 5 + 'px'}}>
                              <SimpleLineChart ar={16.0 / 5.5} data={cardo.aggregationData} name={cardo.title} />
                            </Col>
                          </Row>
                          <Row className="no-margin">
                            <Col md={12} className="no-padding" style={{height: 110 + 'px', overflow: 'auto', fontSize: 12 + 'px'}}>
                              <ListGroup>
                                {cardo.results && cardo.results.map((result, j) =>
                                  <ListGroupItem key={j} href={result.url} title={result.title} target='_blank' style={{padding: 2 + 'px ' + 12 + 'px'}}>
                                    <span className='extra-right-space'>Score: {result.score.toPrecision(2)}</span>
                                    {result.title}
                                    {result.alchemyapi_text 
                                      ? (<p>{result.alchemyapi_text}</p>)
                                      : ('')
                                    }
                                  </ListGroupItem>
                                )}
                              </ListGroup>
                            </Col>
                          </Row>
                        </Col>
                      </Row>                
                    </div>
                  ) 
                }
              }({card})}
            </Col>
          )}
          <DetailsModal show={this.state.detailsShow} data={this.state.modalData} onHide={detailsClose} />
          </div>
        )
      }
    }
  }

  render() {
    return this.showResultsOrError()
  }
}
AlertExample.propTypes = {
  match: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired
}

export class BrandAlerts extends AlertExample {
  constructor(props) {
    super(props)

    const brandName = this.state.params.get('brand_name')
    this.state.query = BRAND_ALERTS
    this.state.keyword = brandName

    this.getBrandAlerts = this.getBrandAlerts.bind(this)
    this.renderSearchBox = this.renderSearchBox.bind(this)
  }

  getBrandAlerts(brandName) {
    const queryString = toQueryString({brand_name: brandName})
    this.getAlerts(`/api/1/track/${BRAND_ALERTS}/?${queryString}`)
  }

  renderSearchBox() {
    return (
      <div>
        <Row>
          <Col md={12}>
            <h1>Brand Alerts</h1>
            <p>Watson will search the latest news for updates related to your brand, enter your brand&rsquo;s name to begin.</p>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <form method='GET'>
              <FormGroup>
                <InputGroup>
                  <FormControl type="text" name='brand_name'
                  placeholder={this.state.keyword || 'Your Brand Name' }/>
                  <InputGroup.Button>
                    <Button type="submit">Submit</Button>
                  </InputGroup.Button>
                </InputGroup>
              </FormGroup>
            </form>
          </Col>
        </Row>
      </div>
    )
  }

  componentDidMount() {
    if (this.state.keyword) {
      this.getBrandAlerts(this.state.keyword)
    }
  }
}

export class ProductAlerts extends AlertExample {
  constructor(props) {
    super(props)

    const productName = this.state.params.get('product_name')
    this.state.query = PRODUCT_ALERTS
    this.state.keyword = productName

    this.getProductAlerts = this.getProductAlerts.bind(this)
    this.renderSearchBox = this.renderSearchBox.bind(this)
  }

  getProductAlerts(productName) {
    const queryString = toQueryString({product_name: productName})
    this.getAlerts(`/api/1/track/${PRODUCT_ALERTS}/?${queryString}`)
  }

  renderSearchBox() {
    return (
      <div>
        <Row>
          <Col md={12}>
            <h1>Product Alerts</h1>
            <p>Watson will search the latest news for updates related to your product, enter your product&rsquo;s name to begin.</p>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <form method='GET'>
              <FormGroup>
                <InputGroup>
                  <FormControl type="text" name='product_name'
                  placeholder={this.state.keyword || 'Your Product Name'}/>
                  <InputGroup.Button>
                    <Button type="submit">Submit</Button>
                  </InputGroup.Button>
                </InputGroup>
              </FormGroup>
            </form>
          </Col>
        </Row>
      </div>
    )
  }

  componentDidMount() {
    if (this.state.keyword) {
      this.getProductAlerts(this.state.keyword)
    }
  }
}

export class RelatedBrands extends AlertExample {
  constructor(props) {
    super(props)

    const brandName = this.state.params.get('brand_name')
    this.state.query = RELATED_BRANDS
    this.state.keyword = brandName

    this.getRelatedBrandsAlerts = this.getRelatedBrandsAlerts.bind(this)
    this.renderSearchBox = this.renderSearchBox.bind(this)
  }

  getRelatedBrandsAlerts(brandName) {
    const queryString = toQueryString({brand_name: brandName})
    this.getAlerts(`/api/1/track/${RELATED_BRANDS}/?${queryString}`)
  }

  renderSearchBox() {
    return (
      <div>
        <Row>
          <Col md={12}>
            <h1>Related Brands</h1>
            <p>Watson will search the latest news for updates related to your brand and use those articles to discover brands in the same industry as yours. Enter your brand&rsquo;s name to begin.</p>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <form method='GET'>
              <FormGroup>
                <InputGroup>
                  <FormControl type="text" name='brand_name'
                  placeholder={this.state.keyword || 'Your Brand Name'}/>
                  <InputGroup.Button>
                    <Button type="submit">Submit</Button>
                  </InputGroup.Button>
                </InputGroup>
              </FormGroup>
            </form>
          </Col>
        </Row>
      </div>
    )
  }

  componentDidMount() {
    if (this.state.keyword) {
      this.getRelatedBrandsAlerts(this.state.keyword)
    }
  }
}

export class PositiveProductAlerts extends AlertExample {
  constructor(props) {
    super(props)

    const productName = this.state.params.get('product_name')
    this.state.query = POSITIVE_PRODUCT_ALERTS
    this.state.keyword = productName

    this.getPositiveProductAlerts = this.getPositiveProductAlerts.bind(this)
    this.renderSearchBox = this.renderSearchBox.bind(this)
  }

  getPositiveProductAlerts(productName) {
    const queryString = toQueryString({product_name: productName})
    this.getAlerts(`/api/1/track/${POSITIVE_PRODUCT_ALERTS}/?${queryString}`)
  }

  renderSearchBox() {
    return (
      <div>
        <Row>
          <Col md={12}>
            <h1>Positive Product Alerts</h1>
            <p>Watson will search the latest news for updates related to your product and include only the positive news articles. Enter your product&rsquo;s name to begin.</p>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <form method='GET'>
              <FormGroup>
                <InputGroup>
                  <FormControl type="text" name='product_name'
                  placeholder={this.state.keyword || 'Your Product Name'}/>
                  <InputGroup.Button>
                    <Button type="submit">Submit</Button>
                  </InputGroup.Button>
                </InputGroup>
              </FormGroup>
            </form>
          </Col>
        </Row>
      </div>
    )
  }

  componentDidMount() {
    if (this.state.keyword) {
      this.getPositiveProductAlerts(this.state.keyword)
    }
  }
}

export class StockAlerts extends AlertExample {
  constructor(props) {
    super(props)

    const stockSymbol = this.state.params.get('stock_symbol')
    this.state.query = STOCK_ALERTS
    this.state.keyword = stockSymbol

    this.getStockAlerts = this.getStockAlerts.bind(this)
    this.renderSearchBox = this.renderSearchBox.bind(this)
  }

  getStockAlerts(stockSymbol) {
    const queryString = toQueryString({stock_symbol: stockSymbol})
    this.getAlerts(`/api/1/track/${STOCK_ALERTS}/?${queryString}`)
  }

  renderSearchBox() {
    return (
      <div>
        <Row>
          <Col md={12}>
            <h1>Stock Alerts</h1>
            <p>Monitor news articles for stock upgrade or downgrade events which may highlight a shift in market confidence towards your brand.</p>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <form method='GET'>
              <FormGroup>
                <InputGroup>
                  <FormControl type="text" name='stock_symbol'
                  placeholder={this.state.keyword || 'Your Stock Ticker Symbol'}/>
                  <InputGroup.Button>
                    <Button type="submit">Submit</Button>
                  </InputGroup.Button>
                </InputGroup>
              </FormGroup>
            </form>
          </Col>
        </Row>
      </div>
    )
  }

  componentDidMount() {
    if (this.state.keyword) {
      this.getStockAlerts(this.state.keyword)
    }
  }
}


export class AllAlerts extends AlertExample {
  constructor(props) {
    super(props)
    // console.log(this.state)
    const tag = this.state.match.params.tag
    // const stockSymbol = this.state.params.get('tag')
    this.state.query = ALL_ALERTS
    this.state.keyword = tag

    this.getAllAlerts = this.getAllAlerts.bind(this)
    this.renderSearchBox = this.renderSearchBox.bind(this)
  }

  getAllAlerts(tag) {
    console.log(tag)
    this.getAAlerts(tag)
  }

  componentDidMount() {
    if (this.state.keyword) {
      this.getAllAlerts(this.state.keyword)
    }
  }
}
