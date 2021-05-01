import React, { Component } from 'react';

export default class Comments extends Component {
  componentDidMount() {
    let script = document.createElement('script');
    let anchor = document.getElementById('inject-comments-for-uterances');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', String(true));
    script.setAttribute(
      'repo',
      'Qwwerty/ignite-template-reactjs-criando-um-projeto-do-zero'
    );
    script.setAttribute('issue-term', 'url');
    script.setAttribute('theme', 'photon-dark');
    anchor.appendChild(script);
  }

  render() {
    return <div id="inject-comments-for-uterances"></div>;
  }
}
