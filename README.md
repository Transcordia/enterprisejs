# EnterpriseJS
### [http://enterprisejs.org/](http://enterprisejs.org/)

## [Composi](http://compo.si/)

A set of news aggregation web services that allow consumers to post links to web content for
retrieval and ratings.

### API

#### Retrieve Topics

Returns a list of topics that describe a particular web resource

    GET  /api/topics

##### Parameters

> **sample**
> > This is a sample

##### Example Request

	https://compo.si/api/topics




## Adding a new entity

In our framework an entity is an object which will be persisted. Our datastore is ElasticSearch
and it uses mapping files to determine how an object and its properties are indexed.

### Establish a structure

Define the JSON structure of the object.
Example:

	tweet = {
		message: 'Sample Tweet',
        user: 'jcook',
        post_date: '2012-06-12T11:07:22'
	}

### Write a mapping file

Mapping files specify how ElasticSearch persists JSON objects. If a mapping file is not provided
ES will make a best guess at how an object should be persisted, but it is much better to help
it along. Mapping controls not only data type, but whether ES will index (make searchable) the
field or not, and if searchable, how the value will be analyzed.

	{
	    "tweet" : {
	        "properties" : {
	            "message" : {"type" : "string", "index" : "porter_standard"},
	            "user" : {"type" : "string", "index" : "lowercase_keyword"},
	            "post_date" : {"type" : "date", "index" : "analyzed"},
	        }
	    }
	}

[Core ElasticSearch Types](http://www.elasticsearch.org/guide/reference/mapping/core-types.html)

#### Index values specifies how the underlying Lucene engine processes the field. Defaults to analyzed.

 * Set to **analyzed** for the field to be indexed and searchable after being broken down into
   token using an analyzer
 * **not_analyzed** means that its still searchable, but does not go through any analysis process or
   broken down into tokens
 * **no** means that it won’t be searchable at all (as an individual field; it may still be
   included in _all).

#### Analyzers specify how the field should broken down into search terms (tokenized).

The analyzer is actually a pretty complex topic involving analysis, tokenizers and filtering.
For our purposes we have pre-configured a few analysers for our purposes in
[elasticsearch-server.properties]

 * **lowercase_keyword** - used for a case insensitive keyword search. A keyword search treats
   the indexed value as a whole string and does not break it up by any delimiters.
 * **porter_standard** - our configuration breaks the input string up into individual terms,
   strips out any html tags, lowercases terms, and the
   [Porter Stemming](http://tartarus.org/~martin/PorterStemmer/) algorithm.

### Create a JSON Schema file

A schema file is used for validation of a JSON object before we persist it to the database. We
are using the [Kris Zyp library](https://github.com/kriszyp/json-schema) for our schema
validation.

	{
		name: 'tweet',
		version: '0.1.0',
		type: ['object'],
		description: 'Basic unit used on Twitter',
        additionalProperties:false,
		properties: {
            message: {type: "string", optional:false},
            user: {type: "string", optional:false, defaultValue:"jcook"},
            post_date:{type: "string", optional:true}
		}
	}

Notice that the date is validated as a string. Although ES understands how to query date ranges
and can perform date math, a date is still persisted as an ISO8601 string value.