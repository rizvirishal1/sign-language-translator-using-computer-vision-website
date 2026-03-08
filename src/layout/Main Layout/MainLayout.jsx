//imports…
import Title from "../../components/Title/Title.jsx";
//styles
import styles from "./mainlayout.module.scss"


export default function MainLayout(props) {

    return (
        <div className={styles.home}>
            <div className={styles.content}>
                <div className={styles.title}>
                    <Title />
                </div>
                <div className={styles.children}>
                    {props.children}
                </div>
            </div>

        </div>
    );
}