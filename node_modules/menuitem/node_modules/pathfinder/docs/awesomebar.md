<!-- contributed by Erik Vold [erikvvold@gmail.com]  -->


The `awesomebar` API provides a simple way to create AwesomeBar suggestions.

## Example ##

    // add github search
    AwesomeBarSuggestion({
      icon: self.data.url("github_16.png"),
      matches: /^(?:@[\w\d_-]+|github\s)/i,
      onSearch: function(query, suggest) {
        query = query.trim();
        if (/^github\s/i.test(query)) {
          query = query.replace(/^github\s/i, "");
          suggest({
            title: 'Search Github for: ' + query,
            favicon: self.data.url("github_16.png"),
            url: 'https://github.com/search?q=' + encodeURIComponent(query)
          }, true);
        } else {
          var username = query.match(/^@([\w\d_-]+)/)[1];
          suggest({
            title: 'Github user: ' + username,
            label: "View user profile for @" + username,
            favicon: self.data.url("github_16.png"),
            url: 'https://github.com/' + username
          }, true);
        }
      }
    });

<api name="AwesomeBarSuggestion">
@class
  A `AwesomeBarSuggestion` constructor is exported, which allows one to create a
  AwesomeBar suggestions.

<api name="AwesomeBarSuggestion">
@constructor
  Creates a AwesomeBar suggestion handler.

@param options {object}
  Options for the AwesomeBar suggester, with the following parameters:

@prop matches {string}
  A regular expression which is tested againsted the location bar input string.

@prop [icon] {string}
  A URL for a 16x16 icon image.

@prop onSearch {function}
  Function that is invoked when the match pattern matches the location bar input
  string.  If will receive too arguments, `query` which is the input string, and
  `suggest` which is a function that can be made to return suggestions.
</api>

<api name="destroy">
@method
  Removes the AwesomeBar suggester.
</api>
</api>
