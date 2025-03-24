Service Agent
=============
Service Agent is a utility that brokers services between a client-app that consumes services and servers that serve them.
It hides the actual server from the client-app by abstracting it. 
Similarly it abstracts a client-app for the server. This arrangement allows true de-coupling of the the apps.

Why Service Agent?
------------------
Let's take an example of a web application that uses a server to get details of, say, a customer.
Typical code written for a RESTful server looks like:
````typescript
//restRequest.ts goes here
````

For a form-based microservice, it may look like :
````typescript
//msRequest.ts goes here
````

These are well accepted in the industry as best practices for de-coupling.
It's true that the server-app and client-app are running independent of each other. And, they communicate with each other using a standard-protocol over a network. Hence we are justifying in saying that they are de-coupled.

Let's say that the server wants to refactor its RESTful structure to add new features. Or, for that matter, a client-app that uses RESTful convention wants to connect to a server that has organized itself into microservices. Such situations expose the "hidden-coupling" between the server-app and the client-app.

This is where the Agent or Broker concept helps. The code snippet for requesting a service through the Service Agent looks like:
````typescript
//agentRequest.ts goes here
````

The Service Agent on the client side provides a simple API for the client-side code to request a service without knowing the actual way in which the server implements the services. The Service Agent in turn handles all the protocol related aspects of reaching out the server, requesting the services with the relevant input data for that service and finally returning the response back to the code that initiated the request.

RESTful paradigm uses "resources" as its building blocks and models the application around the "states" of such resources. So, the requests to servers are typically modelled as "get me the resource so-and-so" or "change the state of the so-and-so resource as per the attachment".

In a Service Based Architecture (SoA), the client-app is typically modelled as set of pages that render certain data, either for just viewing or for editing. The requests are typically "get me data for so-and-so" and "update/create/delete so-and-so entity with attached data".

Simplity is typically used for data-intensive applications. And hence the Service Agent is built for SoA on the client-side. However, it can be used in RESTful paradigm as well because the API has all the features required for a such an approach as well.

Simplity recommends using similar concept on the server as well. All service requests are received by "Server Agent". This component handles the communication including the protocol and the calling paradigm. It provides a simple internal API to the service implementations so that they are independent of the paradigms that the client-apps may choose for requesting the services.

With the agents in place, client-apps can treat the service agent as their server, and the server can treat the server agent as its sole client. API specification is all that they have to honour, there by providing complete flexibility in its use/implementation.


