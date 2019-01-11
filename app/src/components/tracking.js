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
import { Row, Col, Popover, Overlay, Alert, Button, FormControl, ControlLabel, FormGroup } from 'react-bootstrap'
import PropTypes from 'prop-types'
// import { TextInput } from 'watson-react-components/dist/components'

// import 'watson-react-components/dist/css/watson-react-components.min.css'
import 'whatwg-fetch'

// Logic to signup for email tracking from the website
export class Tracking extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: false,
      error: false,
      tracking: false,
      emailValid: false,
      emailInvalid: null,
      email: null,
      frequency: 'daily',
      query: props.query,
      keyword: props.keyword
    }

    this.createTracking = this.createTracking.bind(this)
    this.formSubmit = this.formSubmit.bind(this)
    this.emailChanged = this.emailChanged.bind(this)
    this.frequencyChanged = this.frequencyChanged.bind(this)
  }

  createTracking() {
    this.setState({loading: true})
    const params = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: this.state.email,
        query: this.state.query,
        keyword: this.state.keyword,
        frequency: this.state.frequency
      })
    }
    fetch('/api/1/subscription/', params)
      .then((res) => res.json())
      .then(() => {
        this.setState({tracking: true})
      })
      .catch((error) => {
        console.error(error)
        this.setState({
          loading: false,
          error: true
        })
      })
  }

  emailChanged(e) {
    const value = e.target.value

    // This is the RFC 5322 email regex from http://emailregex.com/
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    // This won't check if the email can actually receive emails though
    if (value && value.match(emailRegex)) {
      this.setState({emailValid: true, emailInvalid: false})
    }

    this.setState({email: value})
  }

  formSubmit(e) {
    e.preventDefault()

    if (this.state.emailValid) {
      console.log('Email is valid.')
      this.createTracking()
    } else {
      console.error('Invalid email was sent.')
      this.setState({emailInvalid: true})
    }
  }

  frequencyChanged(e) {
    const value = e.target.value

    if (value) {
      this.setState({frequency: value})
    }
  }

  render() {
    if (this.state.tracking) {
      return (
        <Row>
          <Col md={12}>
            <Alert bsStyle="success">
              <p className='base--p'>You will now receive updates whenever results for this query have changed.</p>
            </Alert>
          </Col>
        </Row>
      )
    } else if (this.state.error) {
      return (
        <Row>
          <Col md={12}>
            <Alert bsStyle="danger">
              <p className='base--p'>There was an error while trying to track these results, please try again.</p>
            </Alert>
          </Col>
        </Row>
      )
    } else {
      return (
        <Row>
          <Col md={12}>
            <form inline className="form-inline">
              <FormGroup controlId="subscriptionemail">
                <ControlLabel>Receive alerts when these results change:</ControlLabel>
                <Overlay
                  show={this.state.emailInvalid}
                  placement="bottom"
                  container={this}
                  containerPadding={20}
                >
                  <Popover id="popover-contained" title="Error">
                    A <strong>valid</strong> email address is required to track these alerts.
                  </Popover>
                </Overlay>
                <FormControl
                  id='emailAddress'
                  name='emailAddress'
                  className='custom-height'
                  placeholder='Email address'
                  disabled={this.state.loading}
                  onChange={this.emailChanged}
                />
                <FormControl.Feedback />
              </FormGroup>
              <FormGroup controlId="subscriptionefrequency">
                <FormControl
                  componentClass="select"
                  placeholder="select"
                  value={this.state.frequency}
                  onChange={this.frequencyChanged}
                  className='custom-height'
                >
                  <option value="select">select</option>
                  <option value="daily">daily</option>
                  <option value="weekly">weekly</option>
                  <option value="monthly">monthly</option>
                </FormControl>
              </FormGroup>
              <Button className="custom-height" disabled={this.state.loading} onClick={this.formSubmit}>{!this.state.loading ? 'Track' : (<div className="loader"></div>)}</Button>
            </form>
          </Col>
        </Row>
      )
    }
  }
}
Tracking.propTypes = {
  query: PropTypes.string.isRequired,
  keyword: PropTypes.string.isRequired
}
