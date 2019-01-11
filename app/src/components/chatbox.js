import React, { Component } from 'react'
import { Button, Glyphicon, Panel, FormGroup, FormControl, Form } from 'react-bootstrap'
// import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { CSSTransition } from 'react-transition-group';
// import PropTypes from 'prop-types'
// import { TextInput } from 'watson-react-components/dist/components'
// import 'watson-react-components/dist/css/watson-react-components.min.css'
// import 'whatwg-fetch'

export class Chat extends Component {
  // constructor(props) {
    // super(props)
  constructor() {
    super()
    this.state = {
      loading: false,
      expanded: false,
      convo: [],
      message: ''
    }
    this.toggleChatbox = this.toggleChatbox.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  toggleChatbox() {
    this.setState(state => ({
      expanded: !state.expanded
    }));
  }

  handleChange(e) {
   this.setState({
     message: e.target.value}) ;
  }

  handleSubmit(e) {
    e.preventDefault();
    console.log(this.state.message);
    let convoArray = this.state.convo;
    /** Set Your Mesasge in Box */
    convoArray.push({'senderId': 'user', 'text': this.state.message});
    this.setState({message: '', convo: convoArray});
    // API Call for response
    // Uncomment the following Group and add api url
    /* fetch(url)
      .then((res) => res.json())
      .then((data) => {
        convoArray.push({'senderId': 'bot', 'text': data.message});
          // Set API Message in Box 
        this.setState({convo: convoArray});
      })
      .catch((error) => {
        console.error(error);
      }); */
  }
  
  // {this.state.expanded &&}
  render() {
    return (
      <div>
        <div className='chatbox' style={this.state.expanded ? {bottom: 75 + 'px'} : {bottom: 0 + 'px'}}>
          <div className={(this.state.expanded ? 'chatboxanim-active' : 'chatboxanim')}>
          <Panel bsStyle="info" className='chat-panel'>
            <Panel.Heading style={{padding: 5 + 'px ' + 15 + 'px'}}>
              <Panel.Title componentClass="h3">We are live...</Panel.Title>
            </Panel.Heading>
            <Panel.Body style={{height: 300 + 'px', overflow: 'hidden', padding: 0 + 'px', position: 'relative'}}>
              <div style={{position: 'absolute', bottom: 0 + 'px', width: 100 + '%'}}>
                <div className="message-list">
                  {this.state.convo.map((message, index) => {
                      return (
                        <div key= {index} className="message">
                          <div className="message-text">
                            <p>{message.text}</p>
                          </div>
                        </div>
                      )
                  })}
                </div>
              </div>
            </Panel.Body>
            <Panel.Footer style={{padding: 0 + 'px'}}>
              <Form inline onSubmit={this.handleSubmit}>
                <FormGroup>
                  <FormControl
                    type="text"
                    value={this.state.message}
                    placeholder="Type Your message"
                    onChange={this.handleChange}
                  />
                  <Button type='submit' className='sendbutton'><Glyphicon glyph="send"/></Button>
                </FormGroup>
              </Form>
            </Panel.Footer>
          </Panel>
        </div></div>
        <Button bsStyle="info" className='chatbutton' onClick={this.toggleChatbox}>
          {this.state.expanded 
            ? (
                <CSSTransition
                  classNames="chatbuttonanim">
                  <Glyphicon glyph="remove" />
                </CSSTransition>  
              )
            : (
                <CSSTransition
                  classNames="chatbuttonanim">
                  <Glyphicon glyph="comment" />
                </CSSTransition>  
              )
          }
        </Button>
      </div>
    )
  }
}
// Chat.propTypes = {
//     query: PropTypes.string.isRequired,
//     keyword: PropTypes.string.isRequired
// }
