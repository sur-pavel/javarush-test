'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');

const follow = require('./follow'); // function to hop multiple links by "rel"

const root = '/api';


class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {users: [], attributes: [], pageSize: 5, links: {}};
        this.updatePageSize = this.updatePageSize.bind(this);
        this.onCreate = this.onCreate.bind(this);
        this.onEdit = this.onEdit.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onNavigate = this.onNavigate.bind(this);
    }

    // tag::follow-2[]
    loadFromServer(pageSize) {
        follow(client, root, [
            {rel: 'users', params: {size: pageSize}}]
        ).then(userCollection => {
            return client({
                method: 'GET',
                path: userCollection.entity._links.profile.href,
                headers: {'Accept': 'application/schema+json'}
            }).then(schema => {
                this.schema = schema.entity;
                return userCollection;
            });
        }).done(userCollection => {
            this.setState({
                users: userCollection.entity._embedded.users,
                attributes: Object.keys(this.schema.properties),
                pageSize: pageSize,
                links: userCollection.entity._links
            });
        });
    }

    // end::follow-2[]

    // tag::create[]
    onCreate(newUser) {
        follow(client, root, ['users']).then(userCollection => {
            return client({
                method: 'POST',
                path: userCollection.entity._links.self.href,
                entity: newUser,
                headers: {'Content-Type': 'application/json'}
            })
        }).then(response => {
            return follow(client, root, [
                {rel: 'users', params: {'size': this.state.pageSize}}]);
        }).done(response => {
            if (typeof response.entity._links.last != "undefined") {
                this.onNavigate(response.entity._links.last.href);
            } else {
                this.onNavigate(response.entity._links.self.href);
            }
        });
    }

    // end::create[]

    // tag::edit[]
    onEdit(editUser) {
        follow(client, root, ['users']).then(userCollection => {
            return client({
                method: 'PUT',
                path: userCollection.entity._links.self.href,
                entity: editUser,
                headers: {'Content-Type': 'application/json'}
            })
        }).then(response => {
            return follow(client, root, [
                {rel: 'users', params: {'size': this.state.pageSize}}]);
        }).done(response => {
            if (typeof response.entity._links.last != "undefined") {
                this.onNavigate(response.entity._links.last.href);
            } else {
                this.onNavigate(response.entity._links.self.href);
            }
        });
    }

    // end::edit[ ]

    // tag::delete[]
    onDelete(user) {
        client({method: 'DELETE', path: user._links.self.href}).done(response => {
            this.loadFromServer(this.state.pageSize);
        });
    }

    // end::delete[]

    // tag::navigate[]
    onNavigate(navUri) {
        client({method: 'GET', path: navUri}).done(userCollection => {
            this.setState({
                users: userCollection.entity._embedded.users,
                attributes: this.state.attributes,
                pageSize: this.state.pageSize,
                links: userCollection.entity._links
            });
        });
    }

    // end::navigate[]

    // tag::update-page-size[]
    updatePageSize(pageSize) {
        if (pageSize !== this.state.pageSize) {
            this.loadFromServer(pageSize);
        }
    }

    // end::update-page-size[]

    // tag::follow-1[]
    componentDidMount() {
        this.loadFromServer(this.state.pageSize);
    }

    // end::follow-1[]

    render() {
        return (
            <div>
                <CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
                <UserList users={this.state.users}
                          links={this.state.links}
                          pageSize={this.state.pageSize}
                          onNavigate={this.onNavigate}
                          onDelete={this.onDelete}
                          updatePageSize={this.updatePageSize}/>
            </div>
        )
    }
}

// tag::create-dialog[]
class CreateDialog extends React.Component {

    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.getInput = this.getInput.bind(this);
    }

    handleSubmit(e) {
        e.preventDefault();
        const newUser = {};
        this.props.attributes.forEach(attribute => {
            if (attribute === "createdDate") {
                newUser[attribute] = new Date();
            }
            else {
                switch (ReactDOM.findDOMNode(this.refs[attribute]).type) {
                    case "checkbox":
                        newUser[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).checked;
                        break;
                    case "text":
                        newUser[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
                        break;
                    default:
                        console.log("type: " + ReactDOM.findDOMNode(this.refs[attribute]).type +
                            ", attribute: " + attribute);
                }
            }
        });
        this.props.onCreate(newUser);

        // clear out the dialog's inputs
        this.props.attributes.forEach(attribute => {
            ReactDOM.findDOMNode(this.refs[attribute]).value = '';
        });

        // Navigate away from the dialog to hide it.
        window.location = "#";
    }

    getInput(attribute) {
        switch (attribute) {
            case "createdDate":
                return (
                    <iput type="hidden" value={new Date()} placeholder={attribute} ref={attribute} className="field"/>);
                break;
            case "admin":
                return (<div>
                    <input id="demo-copy" name="demo-copy" value="you" type="checkbox" ref={attribute}/>
                    <label htmlFor="demo-copy">admin</label></div>);
                break;
            default:
                return ( <input type="text" placeholder={attribute} ref={attribute} className="field"/>);
        }
    }

    render() {
        var inputs = this.props.attributes.map(attribute =>
            <div key={attribute}>{this.getInput(attribute)}</div>
        );

        return (
            <div>
                <a href="#createUser" className="button customMargin">Create new user</a>
                <div id="createUser" className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>

                        <h2>Create new user</h2>

                        <form>
                            {inputs}
                            <button onClick={this.handleSubmit}>Create</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }


}
// end::create-dialog[]

class UserList extends React.Component {

    constructor(props) {
        super(props);
        this.handleNavFirst = this.handleNavFirst.bind(this);
        this.handleNavPrev = this.handleNavPrev.bind(this);
        this.handleNavNext = this.handleNavNext.bind(this);
        this.handleNavLast = this.handleNavLast.bind(this);
        this.handleInput = this.handleInput.bind(this);
    }

    // tag::handle-page-size-updates[]
    handleInput(e) {
        e.preventDefault();
        var pageSize = ReactDOM.findDOMNode(this.refs.pageSize).value;
        if (/^[0-9]+$/.test(pageSize)) {
            this.props.updatePageSize(pageSize);
        } else {
            ReactDOM.findDOMNode(this.refs.pageSize).value =
                pageSize.substring(0, pageSize.length - 1);
        }
    }

    // end::handle-page-size-updates[]

    // tag::handle-nav[]
    handleNavFirst(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.first.href);
    }

    handleNavPrev(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.prev.href);
    }

    handleNavNext(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.next.href);
    }

    handleNavLast(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.last.href);
    }

    // end::handle-nav[]

    // tag::user-list-render[]
    render() {
        var users = this.props.users.map(user =>
            <User key={user._links.self.href} user={user} onEdit={this.props.onEdit} onDelete={this.props.onDelete}/>
        );

        var navLinks = [];
        if ("first" in this.props.links) {
            navLinks.push(<button className="special" key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
        }
        if ("prev" in this.props.links) {
            navLinks.push(<button className="special" key="prev" onClick={this.handleNavPrev}>&lt;</button>);
        }
        if ("next" in this.props.links) {
            navLinks.push(<button className="special" key="next" onClick={this.handleNavNext}>&gt;</button>);
        }
        if ("last" in this.props.links) {
            navLinks.push(<button className="special" key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
        }

        return (
            <div>
                <div className="row">
                    <div className="3u 6u(medium)">
                        <input id="pageSize" type="text" ref="pageSize" placeholder="items on page"
                               onInput={this.handleInput}/>
                    </div>
                    <div className="2u 12u$(small)">
                        <div className="select-wrapper">
                            <select>
                                <option value="">- Search by -</option>
                                <option value="1">Name</option>
                                <option value="1">Age</option>
                            </select>
                        </div>
                    </div>
                    <div className="3u 12u$(small)">
                        <input id="searchInput" type="text" placeholder="Enter name"/>
                    </div>
                </div>
                <table className="alt">
                    <tbody>
                    <tr>
                        <th id="nameColumn">Name</th>
                        <th>Age</th>
                        <th>Admin</th>
                        <th>Created Date</th>
                        <th/>
                        <th/>
                    </tr>
                    {users}
                    </tbody>
                </table>
                <div>
                    {navLinks}
                </div>
            </div>
        )
    }

    // end::user-list-render[]
}

// tag::user[]
class User extends React.Component {

    constructor(props) {
        super(props);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleEdit() {
        this.props.onEdit(this.props.user);
    }


    handleDelete() {
        this.props.onDelete(this.props.user);
    }

    render() {
        return (
            <tr>
                <td>{this.props.user.name}</td>
                <td>{this.props.user.age}</td>
                {(this.props.user.admin === true) ? <td>&#10004;</td> : <td/>}
                <td>{this.props.user.createdDate}</td>
                <td>
                    <button onClick={this.handleEdit}>Edit</button>
                </td>
                <td>
                    <button onClick={this.handleDelete}>Delete</button>
                </td>
            </tr>
        )
    }
}
// end::user[]

ReactDOM.render(
    <App />,
    document.getElementById('react')
);
