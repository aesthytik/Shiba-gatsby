import React from 'react';

module.exports = class HTML extends React.Component {
  render() {
    return (
      <html lang="en" {...this.props.htmlAttributes}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="stylesheet" href="css/base.css" />
          <link rel="stylesheet" href="css/vendor.css" />
          <link rel="stylesheet" href="css/main.css" />

          <title>ShiBa</title>
        </head>
        <body {...this.props.bodyAttributes}>
          {this.props.preBodyComponents}
          <div
            key="body"
            id="___gatsby"
            dangerouslySetInnerHTML={{ __html: this.props.body }}
          />
          {this.props.postBodyComponents}
          <script src="js/modernizr.js"></script>
          <script src="js/pace.min.js"></script>
          <script src="js/jquery-3.2.1.min.js"></script>
          <script src="js/plugins.js"></script>
          <script src="js/main.js"></script>
        </body>
      </html>
    );
  }
};
